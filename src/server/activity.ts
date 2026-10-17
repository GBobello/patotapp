import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

type Client = Prisma.TransactionClient | typeof db;

/**
 * Registra um acontecimento na linha do tempo da patota (Mecanismo de Percepção do M3C).
 * Alimenta a aba Atividades (RF49) e o sino de notificações (RF48).
 * Falhas aqui nunca devem impedir a ação principal.
 */
export async function logActivity(
  input: {
    patotaId: string;
    actorId?: string | null;
    message: string;
    href?: string;
    managersOnly?: boolean;
  },
  client: Client = db,
) {
  try {
    await client.activity.create({
      data: {
        patotaId: input.patotaId,
        actorId: input.actorId ?? null,
        message: input.message,
        href: input.href,
        audience: input.managersOnly ? "MANAGERS" : "ALL",
      },
    });
  } catch (e) {
    console.error("Falha ao registrar atividade", e);
  }
}

/** Filtro de atividades visíveis para um integrante. */
export function visibleActivityWhere(isManager: boolean) {
  return isManager ? {} : { audience: "ALL" as const };
}
