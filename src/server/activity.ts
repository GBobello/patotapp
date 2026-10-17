import "server-only";
import { after } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { sendActivityPush } from "@/server/push";

type Client = Prisma.TransactionClient | typeof db;

/**
 * Registra um acontecimento na linha do tempo da patota (Mecanismo de Percepção do M3C).
 * Alimenta a aba Atividades (RF49) e o sino de notificações (RF48).
 * Com `push`, também avisa os aparelhos inscritos (RF48) depois da resposta — o mesmo público
 * das notificações no app, sem avisar quem fez a ação; `push.only` restringe a alguns integrantes.
 * Falhas aqui nunca devem impedir a ação principal.
 */
export async function logActivity(
  input: {
    patotaId: string;
    actorId?: string | null;
    message: string;
    href?: string;
    managersOnly?: boolean;
    push?: boolean | { only: string[] };
  },
  client: Client = db,
) {
  try {
    const activity = await client.activity.create({
      data: {
        patotaId: input.patotaId,
        actorId: input.actorId ?? null,
        message: input.message,
        href: input.href,
        audience: input.managersOnly ? "MANAGERS" : "ALL",
      },
    });
    if (input.push) {
      const only = input.push === true ? undefined : input.push.only;
      // Depois da resposta (e do commit, quando chamado dentro de uma transação).
      const send = () => sendActivityPush(activity.id, only);
      try {
        after(send);
      } catch {
        void send(); // fora de uma requisição (ex.: scripts)
      }
    }
  } catch (e) {
    console.error("Falha ao registrar atividade", e);
  }
}

/** Filtro de atividades visíveis para um integrante. */
export function visibleActivityWhere(isManager: boolean) {
  return isManager ? {} : { audience: "ALL" as const };
}
