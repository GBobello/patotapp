import "server-only";

/** Envia o link de acesso. Sem AUTH_RESEND_KEY (desenvolvimento), o link é exibido no terminal. */
type Email = { to: string; subject: string; text: string; html: string };

/** Envia pelo Resend. Sem AUTH_RESEND_KEY (desenvolvimento), mostra o conteúdo no terminal. */
async function sendEmail({ to, subject, text, html }: Email) {
  const apiKey = process.env.AUTH_RESEND_KEY;

  if (!apiKey) {
    console.info(`
[PatotApp] E-mail para ${to} — ${subject}:
${text}
`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "PatotApp <onboarding@resend.dev>", to, subject, text, html }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao enviar e-mail: ${res.status} ${await res.text()}`);
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Envia o link de acesso. */
export async function sendMagicLink(to: string, url: string) {
  await sendEmail({
    to,
    subject: "Seu link de acesso ao PatotApp",
    text: `Olá! Use o link abaixo para entrar no PatotApp (válido por 24 horas):

${url}

Se você não pediu este acesso, ignore este e-mail.`,
    html: `
        <div lang="pt-BR" style="font-family:Arial,sans-serif;font-size:16px;color:#181D17;max-width:480px">
          <h1 style="font-size:22px">Entrar no PatotApp</h1>
          <p>Toque no botão abaixo para entrar. O link vale por 24 horas.</p>
          <p><a href="${url}" style="display:inline-block;background:#1B6B3A;color:#FFFFFF;padding:14px 24px;border-radius:24px;text-decoration:none;font-weight:bold">Entrar no PatotApp</a></p>
          <p style="color:#424940">Se você não pediu este acesso, ignore este e-mail.</p>
        </div>`,
  });
}

/** RF48: lembrete de confirmar presença antes do prazo. */
export async function sendGameReminder(
  to: string,
  game: { patotaName: string; when: string; deadline: string; url: string; profileUrl: string },
) {
  const patota = escapeHtml(game.patotaName);
  await sendEmail({
    to,
    subject: `${game.patotaName}: confirme sua presença até ${game.deadline}`,
    text: `Jogo da ${game.patotaName}: ${game.when}. Você ainda não confirmou presença.
A confirmação fecha ${game.deadline}.

Responda aqui: ${game.url}

Não quer mais estes lembretes? Desligue em ${game.profileUrl}`,
    html: `
        <div lang="pt-BR" style="font-family:Arial,sans-serif;font-size:16px;color:#181D17;max-width:480px">
          <h1 style="font-size:22px">Vai jogar?</h1>
          <p>Jogo da <strong>${patota}</strong>: ${escapeHtml(game.when)}. Você ainda não confirmou presença.</p>
          <p>A confirmação fecha <strong>${escapeHtml(game.deadline)}</strong>.</p>
          <p><a href="${game.url}" style="display:inline-block;background:#1B6B3A;color:#FFFFFF;padding:14px 24px;border-radius:24px;text-decoration:none;font-weight:bold">Responder presença</a></p>
          <p style="color:#424940">Não quer mais estes lembretes? <a href="${game.profileUrl}" style="color:#1B6B3A">Desligue no seu perfil</a>.</p>
        </div>`,
  });
}
