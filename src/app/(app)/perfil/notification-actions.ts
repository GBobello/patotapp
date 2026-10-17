"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/forms";
import { db } from "@/server/db";
import { guarded } from "@/server/guard";
import { requireUser } from "@/server/session";

const subscriptionSchema = z.object({
  endpoint: z.url().max(2000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

/** RF48: inscreve este aparelho para receber notificações push. */
export async function subscribePush(input: unknown): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = subscriptionSchema.safeParse(input);
    if (!parsed.success) return { error: "Não foi possível ativar as notificações neste aparelho." };

    const { endpoint, keys } = parsed.data;
    // O endpoint é do aparelho: se outra conta usava este navegador, a inscrição passa para a atual.
    await db.pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
    });
    return { ok: true, message: "Notificações ativadas neste aparelho." };
  });
}

/** RF48: cancela as notificações push deste aparelho. */
export async function unsubscribePush(endpoint: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUser();
    await db.pushSubscription.deleteMany({ where: { endpoint: String(endpoint), userId: user.id } });
    return { ok: true, message: "Notificações desativadas neste aparelho." };
  });
}

/** RF48: liga ou desliga o lembrete por e-mail antes do prazo de confirmação. */
export async function setEmailReminders(enabled: boolean): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUser();
    await db.user.update({ where: { id: user.id }, data: { emailReminders: enabled === true } });
    revalidatePath("/perfil");
    return {
      ok: true,
      message: enabled ? "Você vai receber lembretes por e-mail." : "Lembretes por e-mail desligados.",
    };
  });
}
