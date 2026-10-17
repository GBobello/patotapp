import "server-only";

/** Envia o link de acesso. Sem AUTH_RESEND_KEY (desenvolvimento), o link é exibido no terminal. */
export async function sendMagicLink(to: string, url: string) {
  const apiKey = process.env.AUTH_RESEND_KEY;

  if (!apiKey) {
    console.info(`\n[PatotApp] Link de acesso para ${to}:\n${url}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "PatotApp <onboarding@resend.dev>",
      to,
      subject: "Seu link de acesso ao PatotApp",
      text: `Olá! Use o link abaixo para entrar no PatotApp (válido por 24 horas):\n\n${url}\n\nSe você não pediu este acesso, ignore este e-mail.`,
      html: `
        <div lang="pt-BR" style="font-family:Arial,sans-serif;font-size:16px;color:#181D17;max-width:480px">
          <h1 style="font-size:22px">Entrar no PatotApp</h1>
          <p>Toque no botão abaixo para entrar. O link vale por 24 horas.</p>
          <p><a href="${url}" style="display:inline-block;background:#1B6B3A;color:#FFFFFF;padding:14px 24px;border-radius:24px;text-decoration:none;font-weight:bold">Entrar no PatotApp</a></p>
          <p style="color:#424940">Se você não pediu este acesso, ignore este e-mail.</p>
        </div>`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao enviar e-mail: ${res.status} ${await res.text()}`);
  }
}
