import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { promotions } from "@/domain/attendance";
import { formatGameDate } from "@/domain/dates";
import { memberName } from "@/domain/members";
import type { Prisma } from "@/generated/prisma/client";
import { logActivity } from "@/server/activity";
import { db } from "@/server/db";
import { requireMember } from "@/server/patotas";

type Tx = Prisma.TransactionClient;

/** Carrega o jogo e garante que o usuário participa da patota dele. */
export const requireGame = cache(async (gameId: string) => {
  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) notFound();
  const ctx = await requireMember(game.patotaId);
  return { ...ctx, game };
});

/**
 * Executa alterações de presença em transação com trava por jogo:
 * duas pessoas confirmando ao mesmo tempo não ultrapassam o limite de vagas.
 */
export async function withGameLock<T>(gameId: string, fn: (tx: Tx) => Promise<T>) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${gameId}))::text`;
    const result = await fn(tx);
    await fillSpots(tx, gameId);
    return result;
  });
}

/** Reaplica as regras de vaga (ex.: a janela dos diaristas abriu desde a última mudança). */
export async function syncGameSpots(gameId: string) {
  return withGameLock(gameId, async () => {});
}

/** Promove quem está na lista de espera enquanto houver vagas (RF20). */
async function fillSpots(tx: Tx, gameId: string) {
  const game = await tx.game.findUniqueOrThrow({
    where: { id: gameId },
    include: {
      attendances: {
        where: { status: { in: ["CONFIRMED", "WAITLIST"] } },
        include: { membership: { include: { user: true } } },
      },
    },
  });

  const confirmedCount = game.attendances.filter((a) => a.status === "CONFIRMED").length;
  const ids = promotions({
    maxPlayers: game.maxPlayers,
    confirmedCount,
    diaristasAllowed: !game.diaristasOpenAt || game.diaristasOpenAt <= new Date(),
    waitlist: game.attendances
      .filter((a) => a.status === "WAITLIST")
      .map((a) => ({
        membershipId: a.membershipId,
        isMensalista: a.membership.type === "MENSALISTA",
        since: a.statusChangedAt,
      })),
  });

  if (ids.length) {
    await tx.attendance.updateMany({
      where: { gameId, membershipId: { in: ids } },
      data: { status: "CONFIRMED", statusChangedAt: new Date() },
    });
    for (const a of game.attendances.filter((x) => ids.includes(x.membershipId))) {
      await logActivity(
        {
          // Sem autor: assim a própria pessoa promovida também recebe a notificação.
          patotaId: game.patotaId,
          message: `${memberName(a.membership)} saiu da lista de espera e está confirmado no jogo de ${formatGameDate(game.startsAt)}`,
          href: `/patotas/${game.patotaId}/jogos/${gameId}`,
        },
        tx,
      );
    }
  }
  return ids;
}

type GameWithAttendances = Prisma.GameGetPayload<{
  include: { attendances: { select: { membershipId: true; status: true; statusChangedAt: true } } };
}>;

export const attendanceSummarySelect = {
  attendances: { select: { membershipId: true, status: true, statusChangedAt: true } },
} as const;

/** Monta o resumo usado nos cartões de jogo (contagens + situação de quem está vendo). */
export function summarizeGame(game: GameWithAttendances, myMembershipId: string, patotaName?: string) {
  const confirmed = game.attendances.filter((a) => a.status === "CONFIRMED");
  const waitlist = game.attendances
    .filter((a) => a.status === "WAITLIST")
    .sort((a, b) => a.statusChangedAt.getTime() - b.statusChangedAt.getTime());
  const mine = game.attendances.find((a) => a.membershipId === myMembershipId);
  const position = waitlist.findIndex((a) => a.membershipId === myMembershipId);

  return {
    id: game.id,
    patotaId: game.patotaId,
    patotaName,
    startsAt: game.startsAt,
    location: game.location,
    maxPlayers: game.maxPlayers,
    status: game.status,
    confirmationDeadline: game.confirmationDeadline,
    confirmedCount: confirmed.length,
    waitlistCount: waitlist.length,
    myStatus: mine?.status ?? null,
    myWaitlistPosition: position >= 0 ? position + 1 : null,
  };
}

/** Jogos que ainda não terminaram (com 3h de tolerância depois do início). */
export function upcomingWhere() {
  return { startsAt: { gte: new Date(Date.now() - 3 * 60 * 60 * 1000) } };
}
