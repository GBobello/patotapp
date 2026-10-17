import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

/**
 * Notificações no app (RF48): atividades das minhas patotas feitas por outras pessoas,
 * respeitando o público (pagamentos só para organizadores).
 */
async function notificationsWhere(userId: string): Promise<Prisma.ActivityWhereInput | null> {
  const memberships = await db.membership.findMany({ where: { userId }, select: { id: true, patotaId: true, role: true } });
  const myIds = memberships.map((m) => m.id);

  if (!memberships.length) return null;
  return {
    AND: [
      {
        OR: memberships.map((m) => ({
          patotaId: m.patotaId,
          ...(m.role === "PLAYER" ? { audience: "ALL" as const } : {}),
        })),
      },
      // Sem autor (ex.: promoção da lista de espera) ou feito por outra pessoa. Atenção: no SQL,
      // "actorId NOT IN (...)" descarta linhas com actorId nulo, por isso o OR explícito.
      { OR: [{ actorId: null }, { actorId: { notIn: myIds } }] },
    ],
  };
}

export async function unreadNotificationCount(userId: string, seenAt: Date | null) {
  const where = await notificationsWhere(userId);
  if (!where) return 0;
  return db.activity.count({ where: { ...where, ...(seenAt ? { createdAt: { gt: seenAt } } : {}) } });
}

export async function listNotifications(userId: string, take = 50) {
  const where = await notificationsWhere(userId);
  if (!where) return [];
  return db.activity.findMany({
    where,
    include: { patota: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}
