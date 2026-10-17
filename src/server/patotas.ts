import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { canManage, isOrganizer } from "@/domain/roles";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

/** Filtro de integrantes ativos (exclui pedidos de entrada pendentes). */
export const ACTIVE = { status: "ACTIVE" } as const;

/**
 * Garante que o usuário logado participa da patota (RN01).
 * Quem não é integrante recebe 404 — não revelamos nem que a patota existe.
 */
export const requireMember = cache(async (patotaId: string) => {
  const user = await requireUser();
  const membership = await db.membership.findUnique({
    where: { patotaId_userId: { patotaId, userId: user.id } },
    include: { patota: true },
  });
  // Pedido de entrada ainda não aprovado (RF10) é tratado como quem não participa.
  if (!membership || membership.status !== "ACTIVE") notFound();

  const { patota, ...member } = membership;
  return { user, membership: member, patota };
});

export class ForbiddenError extends Error {
  constructor(message = "Apenas organizadores podem fazer isso.") {
    super(message);
  }
}

/** Organizador ou co-organizador. */
export async function requireManager(patotaId: string) {
  const ctx = await requireMember(patotaId);
  if (!canManage(ctx.membership.role)) throw new ForbiddenError();
  return ctx;
}

/** Apenas o organizador principal. */
export async function requireOrganizer(patotaId: string) {
  const ctx = await requireMember(patotaId);
  if (!isOrganizer(ctx.membership.role)) throw new ForbiddenError("Apenas o organizador pode fazer isso.");
  return ctx;
}

