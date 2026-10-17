import { timingSafeEqual } from "node:crypto";
import { sendDueReminders } from "@/server/reminders";

/**
 * RF48: lembrete por e-mail antes do prazo de confirmação.
 * Chamado por um agendador (ex.: Vercel Cron a cada hora) com "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("CRON_SECRET não configurado.", { status: 503 });

  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return new Response("Não autorizado.", { status: 401 });
  }

  const origin = new URL(process.env.AUTH_URL ?? request.url).origin;
  return Response.json(await sendDueReminders(origin));
}
