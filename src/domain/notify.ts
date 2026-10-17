// Regras de quem recebe notificações fora do app (RF48): push no PWA e lembrete por e-mail.

import { canManage, type Role } from "./roles";

export type Audience = "ALL" | "MANAGERS";

export type NotifyMember = { id: string; userId: string | null; role: Role };

/**
 * Pessoas (userId) que recebem o push de uma atividade:
 * respeita o público (pagamentos só para organizadores), nunca avisa quem fez a ação
 * e, se `only` for informado, restringe a esses integrantes (ex.: quem foi promovido da espera).
 */
export function pushRecipients(
  members: NotifyMember[],
  activity: { audience: Audience; actorId: string | null },
  only?: string[],
): string[] {
  const users = members
    .filter((m) => m.userId)
    .filter((m) => m.id !== activity.actorId)
    .filter((m) => activity.audience === "ALL" || canManage(m.role))
    .filter((m) => !only || only.includes(m.id))
    .map((m) => m.userId!);
  return [...new Set(users)];
}

export type PushPayload = { title: string; body: string; url: string; tag?: string };

/** Conteúdo exibido pela notificação do sistema (o service worker só repassa estes campos). */
export function buildPushPayload(activity: { id: string; message: string; href: string | null }, patotaName: string): PushPayload {
  return {
    title: patotaName,
    body: activity.message.length > 180 ? `${activity.message.slice(0, 179)}…` : activity.message,
    url: activity.href && activity.href.startsWith("/") && !activity.href.startsWith("//") ? activity.href : "/notificacoes",
    tag: activity.id,
  };
}

const HOUR = 60 * 60 * 1000;

/** Antecedência do lembrete por e-mail em relação ao prazo de confirmação. */
export const REMINDER_WINDOW_HOURS = 24;

/** O jogo deve receber lembrete agora? Prazo ainda aberto, dentro da janela e sem lembrete enviado. */
export function isReminderDue(
  game: { status: string; confirmationDeadline: Date; reminderSentAt: Date | null },
  now: Date = new Date(),
  windowHours = REMINDER_WINDOW_HOURS,
): boolean {
  if (game.status !== "SCHEDULED" || game.reminderSentAt) return false;
  const left = game.confirmationDeadline.getTime() - now.getTime();
  return left > 0 && left <= windowHours * HOUR;
}

export type ReminderMember = {
  id: string;
  type: "MENSALISTA" | "DIARISTA";
  user: { email: string; emailReminders: boolean } | null;
};

/**
 * Quem recebe o lembrete: integrantes com conta e lembrete ligado que ainda não responderam
 * ou marcaram "talvez". Diaristas só quando a janela deles já estiver aberta no prazo (RF19).
 */
export function reminderRecipients(
  members: ReminderMember[],
  attendances: { membershipId: string; status: string }[],
  game: { confirmationDeadline: Date; diaristasOpenAt: Date | null },
): string[] {
  const answered = new Map(attendances.map((a) => [a.membershipId, a.status]));
  const diaristasAllowed = !game.diaristasOpenAt || game.diaristasOpenAt <= game.confirmationDeadline;
  const emails = members
    .filter((m) => m.user?.emailReminders)
    .filter((m) => m.type === "MENSALISTA" || diaristasAllowed)
    .filter((m) => {
      const status = answered.get(m.id);
      return !status || status === "MAYBE";
    })
    .map((m) => m.user!.email);
  return [...new Set(emails)];
}
