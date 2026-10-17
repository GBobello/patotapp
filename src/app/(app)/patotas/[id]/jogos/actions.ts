"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { RESPONSES, checkCanRespond, initialStatus } from "@/domain/attendance";
import { formatGameDate, fromLocalDateTime, toLocalParts } from "@/domain/dates";
import { DrawError, drawTeams } from "@/domain/draw";
import { memberName, memberPositions } from "@/domain/members";
import { canManage } from "@/domain/roles";
import { type StoredDraw, TEAM_NAMES, moveMember, parseStoredDraw } from "@/domain/teams";
import { type ActionResult, emptyToNull, fieldErrorsFrom, formValues } from "@/lib/forms";
import { db } from "@/server/db";
import { requireGame, withGameLock } from "@/server/games";
import { logActivity } from "@/server/activity";
import { guarded } from "@/server/guard";
import { ForbiddenError, requireManager, requireMember } from "@/server/patotas";

const HOUR = 60 * 60 * 1000;

const gameSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data do jogo."),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Escolha o horário."),
    location: z.string().max(120, "Use no máximo 120 caracteres.").nullable(),
    maxPlayers: z.coerce.number().int().min(2, "Mínimo de 2 vagas.").max(60, "Máximo de 60 vagas."),
    teamsCount: z.coerce.number().int().min(2, "Mínimo de 2 times.").max(6, "Máximo de 6 times."),
    deadlineHours: z.coerce.number().int().min(0, "Use 0 ou mais horas.").max(72, "Máximo de 72 horas."),
    notes: z.string().max(300, "Use no máximo 300 caracteres.").nullable(),
    saveAsDefault: z.boolean(),
  })
  .refine((v) => v.maxPlayers >= v.teamsCount * 2, {
    path: ["maxPlayers"],
    message: "Vagas insuficientes: precisa de pelo menos 2 jogadores por time.",
  });

function refreshPatota(patotaId: string) {
  revalidatePath(`/patotas/${patotaId}`, "layout");
  revalidatePath("/");
}

/** RF16, RF17: cria um jogo; opcionalmente salva data/hora como padrão recorrente da patota. */
export async function createGame(patotaId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    await requireManager(patotaId);
    const parsed = gameSchema.safeParse({
      date: formData.get("date") ?? "",
      time: formData.get("time") ?? "",
      location: emptyToNull(formData.get("location")),
      maxPlayers: formData.get("maxPlayers"),
      teamsCount: formData.get("teamsCount"),
      deadlineHours: formData.get("deadlineHours"),
      notes: emptyToNull(formData.get("notes")),
      saveAsDefault: formData.get("saveAsDefault") === "on",
    });
    if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(formData) };

    const { date, time, deadlineHours, saveAsDefault, ...data } = parsed.data;
    const startsAt = fromLocalDateTime(date, time);
    if (!startsAt) return { fieldErrors: { date: "Data ou horário inválido." }, values: formValues(formData) };
    if (startsAt.getTime() < Date.now() - HOUR) {
      return { fieldErrors: { date: "A data do jogo já passou." }, values: formValues(formData) };
    }

    const patota = await db.patota.findUniqueOrThrow({ where: { id: patotaId } });
    const game = await db.game.create({
      data: {
        ...data,
        patotaId,
        startsAt,
        confirmationDeadline: new Date(startsAt.getTime() - deadlineHours * HOUR),
        // RF19: mensalistas têm prioridade até X horas antes do jogo.
        diaristasOpenAt:
          patota.diaristaWindowHours === null ? null : new Date(startsAt.getTime() - patota.diaristaWindowHours * HOUR),
      },
    });

    if (saveAsDefault) {
      await db.patota.update({
        where: { id: patotaId },
        data: {
          defaultWeekday: toLocalParts(startsAt).weekday,
          defaultTime: time,
          defaultMaxPlayers: data.maxPlayers,
          defaultTeamsCount: data.teamsCount,
          defaultDeadlineHours: deadlineHours,
          ...(data.location ? { location: data.location } : {}),
        },
      });
    }

    await logActivity({
      patotaId,
      message: `Novo jogo marcado: ${formatGameDate(startsAt)}`,
      href: `/patotas/${patotaId}/jogos/${game.id}`,
    });
    refreshPatota(patotaId);
    redirect(`/patotas/${patotaId}/jogos/${game.id}`);
  });
}

/** RF18: o próprio jogador confirma, marca talvez ou recusa. */
export async function respond(gameId: string, wanted: string) {
  return guarded(async () => {
    const { game, membership, user } = await requireGame(gameId);
    const response = z.enum(RESPONSES).parse(wanted);

    const blocked = checkCanRespond({ ...game, isManager: canManage(membership.role) });
    if (blocked) return { error: blocked };

    const changed = await withGameLock(gameId, async (tx) => {
      const current = await tx.attendance.findUnique({
        where: { gameId_membershipId: { gameId, membershipId: membership.id } },
      });
      const status = initialStatus(response, current?.status ?? null);
      if (current?.status === status) return false;

      await tx.attendance.upsert({
        where: { gameId_membershipId: { gameId, membershipId: membership.id } },
        create: { gameId, membershipId: membership.id, status },
        update: { status, statusChangedAt: new Date() },
      });
      return true;
    });

    const mine = await db.attendance.findUniqueOrThrow({
      where: { gameId_membershipId: { gameId, membershipId: membership.id } },
    });
    if (changed) {
      const name = memberName({ ...membership, user });
      const verbs = {
        CONFIRMED: "confirmou presença",
        WAITLIST: "entrou na lista de espera",
        MAYBE: "marcou talvez",
        DECLINED: "não vai",
      } as const;
      await logActivity({
        patotaId: game.patotaId,
        actorId: membership.id,
        message: `${name} ${verbs[mine.status]} no jogo de ${formatGameDate(game.startsAt)}`,
        href: `/patotas/${game.patotaId}/jogos/${gameId}`,
      });
    }
    refreshPatota(game.patotaId);

    const waitingWindow =
      mine.status === "WAITLIST" && membership.type === "DIARISTA" && game.diaristasOpenAt && game.diaristasOpenAt > new Date();
    const messages = {
      CONFIRMED: "Presença confirmada. Bom jogo!",
      WAITLIST: waitingWindow
        ? `Mensalistas têm prioridade até ${formatGameDate(game.diaristasOpenAt!)}. Você está na lista de espera.`
        : "Vagas esgotadas: você entrou na lista de espera e será promovido se abrir vaga.",
      MAYBE: "Marcado como talvez. Confirme assim que souber!",
      DECLINED: "Tudo bem, fica para a próxima.",
    } as const;
    return { ok: true, message: messages[mine.status] };
  });
}

/** RF22: organizador altera a presença de qualquer integrante (inclusive após o prazo). */
export async function setAttendance(gameId: string, membershipId: string, wanted: string) {
  return guarded(async () => {
    const { game, membership } = await requireGame(gameId);
    if (!canManage(membership.role)) throw new ForbiddenError();
    const target = await db.membership.findFirst({ where: { id: membershipId, patotaId: game.patotaId } });
    if (!target) throw new ForbiddenError("Integrante não encontrado.");

    const blocked = checkCanRespond({ ...game, isManager: true });
    if (blocked) return { error: blocked };

    await withGameLock(gameId, async (tx) => {
      if (wanted === "NONE") {
        await tx.attendance.deleteMany({ where: { gameId, membershipId } });
        return;
      }
      const response = z.enum(RESPONSES).parse(wanted);
      const current = await tx.attendance.findUnique({ where: { gameId_membershipId: { gameId, membershipId } } });
      const status = initialStatus(response, current?.status ?? null);
      await tx.attendance.upsert({
        where: { gameId_membershipId: { gameId, membershipId } },
        create: { gameId, membershipId, status },
        update: { status, statusChangedAt: new Date() },
      });
    });

    refreshPatota(game.patotaId);
    return { ok: true, message: "Presença atualizada." };
  });
}

/** RF23: cancelar jogo. */
export async function cancelGame(gameId: string) {
  return guarded(async () => {
    const { game } = await requireGame(gameId);
    const { membership } = await requireManager(game.patotaId);
    await db.game.update({ where: { id: gameId }, data: { status: "CANCELLED" } });
    await logActivity({
      patotaId: game.patotaId,
      actorId: membership.id,
      message: `Jogo de ${formatGameDate(game.startsAt)} foi cancelado`,
      href: `/patotas/${game.patotaId}/jogos/${gameId}`,
    });
    refreshPatota(game.patotaId);
    return { ok: true, message: "Jogo cancelado." };
  });
}

// ---------- Sorteio de times (ciclo 5) ----------

/** RF29–RF32: sorteia os times entre os confirmados. O resultado fica oculto até ser publicado. */
export async function drawGameTeams(gameId: string) {
  return guarded(async () => {
    const { game } = await requireGame(gameId);
    await requireManager(game.patotaId);
    if (game.status === "CANCELLED") return { error: "Este jogo foi cancelado." };

    const confirmed = await db.attendance.findMany({
      where: { gameId, status: "CONFIRMED" },
      include: { membership: { include: { user: true } } },
    });

    try {
      const result = drawTeams(
        confirmed.map(({ membership: m }) => ({
          id: m.id,
          rating: m.rating,
          ...memberPositions(m),
        })),
        { teamsCount: game.teamsCount },
      );
      const draw: StoredDraw = {
        teams: result.teams.map((t) => ({
          members: t.players.map((p) => ({ membershipId: p.id, role: p.role })),
        })),
        warnings: result.warnings,
      };
      await db.game.update({ where: { id: gameId }, data: { draw, drawPublishedAt: null } });
    } catch (e) {
      if (e instanceof DrawError) return { error: e.message };
      throw e;
    }

    revalidatePath(`/patotas/${game.patotaId}/jogos/${gameId}`);
    return { ok: true, message: "Times sorteados! Confira e publique para a galera ver." };
  });
}

/** RF35: torna os times visíveis para todos. */
export async function publishDraw(gameId: string) {
  return guarded(async () => {
    const { game } = await requireGame(gameId);
    await requireManager(game.patotaId);
    if (!game.draw) return { error: "Sorteie os times primeiro." };

    await db.game.update({ where: { id: gameId }, data: { drawPublishedAt: new Date() } });
    await logActivity({
      patotaId: game.patotaId,
      message: `Times do jogo de ${formatGameDate(game.startsAt)} publicados`,
      href: `/patotas/${game.patotaId}/jogos/${gameId}`,
    });
    refreshPatota(game.patotaId);
    return { ok: true, message: "Times publicados para todos." };
  });
}

/** RF34: ajuste manual — move um jogador para outro time. */
export async function moveDrawPlayer(gameId: string, membershipId: string, toTeam: number) {
  return guarded(async () => {
    const { game } = await requireGame(gameId);
    await requireManager(game.patotaId);
    const draw = parseStoredDraw(game.draw);
    if (!draw) return { error: "Sorteie os times primeiro." };

    await db.game.update({ where: { id: gameId }, data: { draw: moveMember(draw, membershipId, toTeam) } });
    revalidatePath(`/patotas/${game.patotaId}/jogos/${gameId}`);
    return { ok: true, message: `Jogador movido para o ${TEAM_NAMES[toTeam]}.` };
  });
}

// ---------- Comentários do jogo (ciclo 7) ----------

const commentSchema = z.object({
  text: z.string().trim().min(1, "Escreva o comentário.").max(300, "Use no máximo 300 caracteres."),
});

/** RF47: qualquer integrante comenta no jogo. */
export async function addGameComment(gameId: string, _prev: ActionResult, formData: FormData) {
  return guarded(async () => {
    const { game, membership, user } = await requireGame(gameId);
    const parsed = commentSchema.safeParse({ text: formData.get("text") ?? "" });
    if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(formData) };

    await db.gameComment.create({ data: { gameId, authorId: membership.id, text: parsed.data.text } });
    await logActivity({
      patotaId: game.patotaId,
      actorId: membership.id,
      message: `${memberName({ ...membership, user })} comentou no jogo de ${formatGameDate(game.startsAt)}: “${parsed.data.text.slice(0, 60)}”`,
      href: `/patotas/${game.patotaId}/jogos/${gameId}#comentarios`,
    });
    revalidatePath(`/patotas/${game.patotaId}/jogos/${gameId}`);
    return { ok: true };
  });
}

/** O autor ou um organizador apaga o comentário. */
export async function deleteGameComment(commentId: string) {
  return guarded(async () => {
    const comment = await db.gameComment.findUnique({ where: { id: commentId }, include: { game: true } });
    if (!comment) return { error: "Comentário não encontrado." };
    const { membership } = await requireMember(comment.game.patotaId);
    if (comment.authorId !== membership.id && !canManage(membership.role)) throw new ForbiddenError();

    await db.gameComment.delete({ where: { id: commentId } });
    revalidatePath(`/patotas/${comment.game.patotaId}/jogos/${comment.gameId}`);
    return { ok: true, message: "Comentário apagado." };
  });
}
