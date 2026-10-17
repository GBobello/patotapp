"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { RESPONSES, checkCanRespond, initialStatus } from "@/domain/attendance";
import { formatGameDate, fromLocalDateTime, toLocalParts } from "@/domain/dates";
import { DrawError, drawTeams } from "@/domain/draw";
import { demotions, gameDeadlines } from "@/domain/games";
import { effectiveRating, memberName, memberPositions } from "@/domain/members";
import { canManage } from "@/domain/roles";
import { type StoredDraw, moveMember, parseStoredDraw, teamName } from "@/domain/teams";
import { type ActionResult, emptyToNull, fieldErrorsFrom, formValues } from "@/lib/forms";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { requireGame, withGameLock } from "@/server/games";
import { logActivity } from "@/server/activity";
import { guarded } from "@/server/guard";
import { ForbiddenError, peerRatingsByMember, requireManager, requireMember } from "@/server/patotas";

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

/** Valida o formulário de jogo (criar e editar). */
function parseGameForm(formData: FormData) {
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
  if (!parsed.success) return { error: { fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(formData) } } as const;

  const startsAt = fromLocalDateTime(parsed.data.date, parsed.data.time);
  if (!startsAt) return { error: { fieldErrors: { date: "Data ou horário inválido." }, values: formValues(formData) } } as const;
  if (startsAt.getTime() < Date.now() - HOUR) {
    return { error: { fieldErrors: { date: "A data do jogo já passou." }, values: formValues(formData) } } as const;
  }
  return { data: parsed.data, startsAt } as const;
}

/** Jogo já existe nesse horário (restrição única patotaId + startsAt). */
function isDuplicateGame(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002";
}

/** RF16, RF17: cria um jogo; opcionalmente salva data/hora como padrão recorrente da patota. */
export async function createGame(patotaId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const { membership } = await requireManager(patotaId);
    const result = parseGameForm(formData);
    if (result.error) return result.error;

    const { startsAt } = result;
    const { time, deadlineHours, saveAsDefault, location, maxPlayers, teamsCount, notes } = result.data;
    const data = { location, maxPlayers, teamsCount, notes };
    const patota = await db.patota.findUniqueOrThrow({ where: { id: patotaId } });
    let game;
    try {
      game = await db.game.create({
        data: {
          ...data,
          patotaId,
          startsAt,
          // RF19: mensalistas têm prioridade até X horas antes do jogo.
          ...gameDeadlines(startsAt, deadlineHours, patota.diaristaWindowHours),
        },
      });
    } catch (e) {
      if (!isDuplicateGame(e)) throw e;
      return { fieldErrors: { date: "Já existe um jogo marcado nesse dia e horário." }, values: formValues(formData) };
    }

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
      actorId: membership.id,
      message: `Novo jogo marcado: ${formatGameDate(startsAt)}`,
      href: `/patotas/${patotaId}/jogos/${game.id}`,
      push: true,
    });
    refreshPatota(patotaId);
    redirect(`/patotas/${patotaId}/jogos/${game.id}`);
  });
}

/**
 * Editar jogo: data, local, vagas, times, prazo e observações.
 * Mais vagas → promove da lista de espera; menos vagas → quem confirmou por último volta para a espera.
 */
export async function updateGame(gameId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const { game } = await requireGame(gameId);
    const { membership, patota } = await requireManager(game.patotaId);
    if (game.status === "CANCELLED") return { error: "Este jogo foi cancelado." };

    const result = parseGameForm(formData);
    if (result.error) return result.error;
    const { startsAt } = result;
    const { deadlineHours, location, maxPlayers, teamsCount, notes } = result.data;

    let demoted: string[] = [];
    try {
      demoted = await withGameLock(gameId, async (tx) => {
        await tx.game.update({
          where: { id: gameId },
          data: {
            startsAt,
            location,
            maxPlayers,
            teamsCount,
            notes,
            ...gameDeadlines(startsAt, deadlineHours, patota.diaristaWindowHours),
            // Mudou o número de times: o sorteio antigo deixa de valer.
            ...(teamsCount !== game.teamsCount ? { draw: Prisma.DbNull, drawPublishedAt: null } : {}),
          },
        });

        const confirmed = await tx.attendance.findMany({ where: { gameId, status: "CONFIRMED" } });
        const ids = demotions(
          confirmed.map((a) => ({ membershipId: a.membershipId, since: a.statusChangedAt })),
          maxPlayers,
        );
        // Mantém statusChangedAt: quem volta fica à frente de quem já estava na espera.
        if (ids.length) await tx.attendance.updateMany({ where: { gameId, membershipId: { in: ids } }, data: { status: "WAITLIST" } });
        return ids;
      });
    } catch (e) {
      if (!isDuplicateGame(e)) throw e;
      return { fieldErrors: { date: "Já existe um jogo marcado nesse dia e horário." }, values: formValues(formData) };
    }

    await logActivity({
      patotaId: game.patotaId,
      actorId: membership.id,
      message: `Jogo de ${formatGameDate(game.startsAt)} foi alterado${
        startsAt.getTime() !== game.startsAt.getTime() ? ` (agora ${formatGameDate(startsAt)})` : ""
      }${demoted.length ? `; ${demoted.length} voltaram para a lista de espera` : ""}`,
      href: `/patotas/${game.patotaId}/jogos/${gameId}`,
      push: true,
    });
    refreshPatota(game.patotaId);
    redirect(`/patotas/${game.patotaId}/jogos/${gameId}?${demoted.length ? `editado=${demoted.length}` : "editado=0"}`);
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
    const target = await db.membership.findFirst({ where: { id: membershipId, patotaId: game.patotaId, status: "ACTIVE" } });
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
      push: true,
    });
    refreshPatota(game.patotaId);
    return { ok: true, message: "Jogo cancelado." };
  });
}

// ---------- Sorteio de times (ciclo 5) ----------

/** RF29–RF32: sorteia os times entre os confirmados. O resultado fica oculto até ser publicado. */
export async function drawGameTeams(gameId: string) {
  return guarded(async () => {
    const { game, patota } = await requireGame(gameId);
    await requireManager(game.patotaId);
    if (game.status === "CANCELLED") return { error: "Este jogo foi cancelado." };

    const [confirmed, rules] = await Promise.all([
      db.attendance.findMany({
        where: { gameId, status: "CONFIRMED" },
        include: { membership: { include: { user: true } } },
      }),
      db.drawRule.findMany({ where: { patotaId: game.patotaId } }),
    ]);
    const peers = await peerRatingsByMember(game.patotaId, patota.peerRatingEnabled);
    const pairs = (kind: "TOGETHER" | "APART") =>
      rules.filter((r) => r.kind === kind).map((r) => [r.firstId, r.secondId] as [string, string]);

    try {
      const result = drawTeams(
        confirmed.map(({ membership: m }) => ({
          id: m.id,
          // RF28: com avaliação entre pares, mistura a nota do organizador com a da galera.
          rating: effectiveRating(m.rating, peers.get(m.id) ?? []),
          ...memberPositions(m),
        })),
        { teamsCount: game.teamsCount, together: pairs("TOGETHER"), apart: pairs("APART") },
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
    const { membership } = await requireManager(game.patotaId);
    if (!game.draw) return { error: "Sorteie os times primeiro." };

    await db.game.update({ where: { id: gameId }, data: { drawPublishedAt: new Date() } });
    await logActivity({
      patotaId: game.patotaId,
      actorId: membership.id,
      message: `Times do jogo de ${formatGameDate(game.startsAt)} publicados`,
      href: `/patotas/${game.patotaId}/jogos/${gameId}`,
      push: true,
    });
    refreshPatota(game.patotaId);
    return { ok: true, message: "Times publicados para todos." };
  });
}

/** RF34: ajuste manual — move um jogador para outro time. */
export async function moveDrawPlayer(gameId: string, membershipId: string, toTeam: number) {
  return guarded(async () => {
    const { game, patota } = await requireGame(gameId);
    await requireManager(game.patotaId);
    const draw = parseStoredDraw(game.draw);
    if (!draw) return { error: "Sorteie os times primeiro." };

    await db.game.update({ where: { id: gameId }, data: { draw: moveMember(draw, membershipId, toTeam) } });
    revalidatePath(`/patotas/${game.patotaId}/jogos/${gameId}`);
    return { ok: true, message: `Jogador movido para ${teamName(toTeam, patota.teamNames)}.` };
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

// ---------- Resultado do jogo (RF52) ----------

const smallInt = (max: number) => (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").trim() || 0);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : null;
};

/** Organizador registra quem compareceu, os gols e o placar. O rateio passa a usar a presença real. */
export async function saveGameResult(gameId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const { game } = await requireGame(gameId);
    const { membership, patota } = await requireManager(game.patotaId);
    if (game.status === "CANCELLED") return { error: "Este jogo foi cancelado." };
    if (game.startsAt > new Date()) return { error: "O resultado só pode ser registrado depois que o jogo começar." };

    const attendances = await db.attendance.findMany({ where: { gameId } });
    const draw = parseStoredDraw(game.draw);

    const goals = new Map<string, number>();
    for (const a of attendances) {
      const g = smallInt(50)(formData.get(`goals:${a.membershipId}`));
      if (g === null) return { error: "Gols devem ser números inteiros entre 0 e 50." };
      goals.set(a.membershipId, g);
    }

    // Placar só vale completo: todos os times preenchidos.
    const rawScores = (draw?.teams ?? []).map((_, i) => formData.get(`score:${i}`));
    const filled = rawScores.filter((v) => String(v ?? "").trim() !== "");
    let teamScores: number[] = [];
    if (filled.length > 0) {
      if (filled.length !== rawScores.length) return { error: "Preencha o placar de todos os times (ou deixe todos vazios)." };
      const parsed = rawScores.map(smallInt(99));
      if (parsed.some((s) => s === null)) return { error: "O placar deve ter números inteiros entre 0 e 99." };
      teamScores = parsed as number[];
    }

    await db.$transaction([
      ...attendances.map((a) =>
        db.attendance.update({
          where: { id: a.id },
          data: { attended: formData.get(`attended:${a.membershipId}`) === "on", goals: goals.get(a.membershipId) ?? 0 },
        }),
      ),
      db.game.update({ where: { id: gameId }, data: { teamScores, resultSavedAt: new Date() } }),
    ]);

    const scoreText = teamScores.length
      ? ` — ${teamScores.map((s, i) => `${teamName(i, patota.teamNames)} ${s}`).join(" × ")}`
      : "";
    await logActivity({
      patotaId: game.patotaId,
      actorId: membership.id,
      message: `Resultado do jogo de ${formatGameDate(game.startsAt)} registrado${scoreText}`,
      href: `/patotas/${game.patotaId}/jogos/${gameId}`,
      push: true,
    });
    revalidatePath(`/patotas/${game.patotaId}`, "layout");
    return { ok: true, message: "Resultado salvo. As cobranças do jogo agora usam quem compareceu." };
  });
}

// ---------- Tarefas do jogo (RF51) ----------

const taskSchema = z.string().trim().min(2, "Descreva a tarefa.").max(60, "Use no máximo 60 caracteres.");

/** Qualquer integrante cria uma tarefa (ex.: "Levar bola"); quem cria pode já assumir. */
export async function addGameTask(gameId: string, title: string, assignToMe = false): Promise<ActionResult> {
  return guarded(async () => {
    const { game, membership } = await requireGame(gameId);
    if (game.status === "CANCELLED") return { error: "Este jogo foi cancelado." };
    const parsed = taskSchema.safeParse(title);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const exists = await db.gameTask.findFirst({ where: { gameId, title: { equals: parsed.data, mode: "insensitive" } } });
    if (exists) return { error: "Essa tarefa já está na lista." };

    await db.gameTask.create({
      data: { gameId, title: parsed.data, assigneeId: assignToMe ? membership.id : null },
    });
    revalidatePath(`/patotas/${game.patotaId}/jogos/${gameId}`);
    return { ok: true, message: assignToMe ? `Combinado: "${parsed.data}" é com você.` : "Tarefa adicionada." };
  });
}

async function loadTask(taskId: string) {
  const task = await db.gameTask.findUnique({ where: { id: taskId }, include: { game: true } });
  if (!task) throw new ForbiddenError("Tarefa não encontrada.");
  const ctx = await requireMember(task.game.patotaId);
  return { task, ...ctx };
}

/** Assumir uma tarefa livre. */
export async function takeGameTask(taskId: string): Promise<ActionResult> {
  return guarded(async () => {
    const { task, membership, user } = await loadTask(taskId);
    // updateMany com assigneeId null evita que duas pessoas peguem a mesma tarefa ao mesmo tempo.
    const { count } = await db.gameTask.updateMany({
      where: { id: taskId, assigneeId: null },
      data: { assigneeId: membership.id },
    });
    if (!count) return { error: "Alguém já pegou essa tarefa." };

    await logActivity({
      patotaId: task.game.patotaId,
      actorId: membership.id,
      message: `${memberName({ ...membership, user })} vai cuidar de "${task.title}" no jogo de ${formatGameDate(task.game.startsAt)}`,
      href: `/patotas/${task.game.patotaId}/jogos/${task.gameId}`,
    });
    revalidatePath(`/patotas/${task.game.patotaId}/jogos/${task.gameId}`);
    return { ok: true, message: `Valeu! "${task.title}" é com você.` };
  });
}

/** Largar a tarefa (a própria; organizadores podem liberar a de qualquer um). */
export async function releaseGameTask(taskId: string): Promise<ActionResult> {
  return guarded(async () => {
    const { task, membership } = await loadTask(taskId);
    if (task.assigneeId !== membership.id && !canManage(membership.role)) throw new ForbiddenError();
    await db.gameTask.update({ where: { id: taskId }, data: { assigneeId: null } });
    revalidatePath(`/patotas/${task.game.patotaId}/jogos/${task.gameId}`);
    return { ok: true, message: `"${task.title}" está livre de novo.` };
  });
}

export async function deleteGameTask(taskId: string): Promise<ActionResult> {
  return guarded(async () => {
    const { task, membership } = await loadTask(taskId);
    if (!canManage(membership.role)) throw new ForbiddenError();
    await db.gameTask.delete({ where: { id: taskId } });
    revalidatePath(`/patotas/${task.game.patotaId}/jogos/${task.gameId}`);
    return { ok: true, message: "Tarefa removida." };
  });
}
