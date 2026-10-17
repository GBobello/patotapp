"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { RESPONSES, checkCanRespond, initialStatus } from "@/domain/attendance";
import { fromLocalDateTime, toLocalParts } from "@/domain/dates";
import { canManage } from "@/domain/roles";
import { type ActionResult, emptyToNull, fieldErrorsFrom, formValues } from "@/lib/forms";
import { db } from "@/server/db";
import { requireGame, withGameLock } from "@/server/games";
import { guarded } from "@/server/guard";
import { ForbiddenError, requireManager } from "@/server/patotas";

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

    const game = await db.game.create({
      data: { ...data, patotaId, startsAt, confirmationDeadline: new Date(startsAt.getTime() - deadlineHours * HOUR) },
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

    refreshPatota(patotaId);
    redirect(`/patotas/${patotaId}/jogos/${game.id}`);
  });
}

/** RF18: o próprio jogador confirma, marca talvez ou recusa. */
export async function respond(gameId: string, wanted: string) {
  return guarded(async () => {
    const { game, membership } = await requireGame(gameId);
    const response = z.enum(RESPONSES).parse(wanted);

    const blocked = checkCanRespond({ ...game, isManager: canManage(membership.role) });
    if (blocked) return { error: blocked };

    await withGameLock(gameId, async (tx) => {
      const current = await tx.attendance.findUnique({
        where: { gameId_membershipId: { gameId, membershipId: membership.id } },
      });
      const status = initialStatus(response, current?.status ?? null);
      if (current?.status === status) return;

      await tx.attendance.upsert({
        where: { gameId_membershipId: { gameId, membershipId: membership.id } },
        create: { gameId, membershipId: membership.id, status },
        update: { status, statusChangedAt: new Date() },
      });
    });

    const mine = await db.attendance.findUniqueOrThrow({
      where: { gameId_membershipId: { gameId, membershipId: membership.id } },
    });
    refreshPatota(game.patotaId);

    const messages = {
      CONFIRMED: "Presença confirmada. Bom jogo!",
      WAITLIST: "Vagas esgotadas: você entrou na lista de espera e será promovido se abrir vaga.",
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
    await requireManager(game.patotaId);
    await db.game.update({ where: { id: gameId }, data: { status: "CANCELLED" } });
    refreshPatota(game.patotaId);
    return { ok: true, message: "Jogo cancelado." };
  });
}
