import "server-only";
import { formatGameDate, formatGameDateLong } from "@/domain/dates";
import { REMINDER_WINDOW_HOURS, isReminderDue, reminderRecipients } from "@/domain/notify";
import { db } from "@/server/db";
import { sendGameReminder } from "@/server/email";

/**
 * RF48: envia o lembrete por e-mail dos jogos cujo prazo de confirmação fecha nas próximas 24 horas.
 * Cada jogo é marcado antes do envio, então rodar de novo (ou em paralelo) não repete o lembrete.
 */
export async function sendDueReminders(origin: string, now: Date = new Date()) {
  const games = await db.game.findMany({
    where: {
      status: "SCHEDULED",
      reminderSentAt: null,
      confirmationDeadline: { gt: now, lte: new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000) },
    },
    include: {
      patota: {
        select: {
          name: true,
          memberships: {
            where: { userId: { not: null } },
            select: { id: true, type: true, user: { select: { email: true, emailReminders: true } } },
          },
        },
      },
      attendances: { select: { membershipId: true, status: true } },
    },
  });

  let emails = 0;
  for (const game of games.filter((g) => isReminderDue(g, now))) {
    const claimed = await db.game.updateMany({ where: { id: game.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (!claimed.count) continue;

    const recipients = reminderRecipients(game.patota.memberships, game.attendances, game);
    for (const to of recipients) {
      try {
        await sendGameReminder(to, {
          patotaName: game.patota.name,
          when: formatGameDateLong(game.startsAt),
          deadline: formatGameDate(game.confirmationDeadline),
          url: `${origin}/patotas/${game.patotaId}/jogos/${game.id}`,
          profileUrl: `${origin}/perfil`,
        });
        emails++;
      } catch (e) {
        console.error("Falha ao enviar lembrete", e);
      }
    }
  }
  return { games: games.length, emails };
}
