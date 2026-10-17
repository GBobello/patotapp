import "server-only";
import webpush from "web-push";
import { buildPushPayload, pushRecipients } from "@/domain/notify";
import { db } from "@/server/db";

/** Chave pública VAPID usada pelo navegador ao se inscrever. Sem chaves, o push fica desligado. */
export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? process.env.VAPID_PUBLIC_KEY : null;
}

let configured = false;
function configure() {
  const publicKey = vapidPublicKey();
  if (!publicKey) return false;
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:contato@patotapp.app", publicKey, process.env.VAPID_PRIVATE_KEY!);
    configured = true;
  }
  return true;
}

/**
 * Envia o push de uma atividade aos aparelhos inscritos (RF48).
 * Lê a atividade do banco: se a transação que a criou foi desfeita, nada é enviado.
 * Inscrições expiradas (404/410) são removidas. Nunca lança erro.
 */
export async function sendActivityPush(activityId: string, only?: string[]) {
  try {
    if (!configure()) return;
    const activity = await db.activity.findUnique({
      where: { id: activityId },
      include: {
        patota: {
          select: { name: true, memberships: { select: { id: true, userId: true, role: true } } },
        },
      },
    });
    if (!activity) return;

    const userIds = pushRecipients(activity.patota.memberships, activity, only);
    if (!userIds.length) return;
    const subscriptions = await db.pushSubscription.findMany({ where: { userId: { in: userIds } } });
    const payload = JSON.stringify(buildPushPayload(activity, activity.patota.name));

    const expired: string[] = [];
    await Promise.all(
      subscriptions.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 60 * 60 * 24, urgency: "normal" },
          );
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) expired.push(s.id);
          else console.error("Falha ao enviar push", status ?? e);
        }
      }),
    );
    if (expired.length) await db.pushSubscription.deleteMany({ where: { id: { in: expired } } });
  } catch (e) {
    console.error("Falha ao enviar notificações push", e);
  }
}
