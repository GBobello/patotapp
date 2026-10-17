// Textos prontos para compartilhar no WhatsApp (RF24). *negrito* é a sintaxe do WhatsApp.

import { formatGameDate } from "./dates";

export function gameListMessage(input: {
  patotaName: string;
  startsAt: Date;
  location: string | null;
  maxPlayers: number;
  confirmed: string[];
  waitlist: string[];
  maybe: string[];
  link: string;
}) {
  const lines = [
    `⚽ *${input.patotaName}* — ${formatGameDate(input.startsAt)}`,
    input.location ? `📍 ${input.location}` : null,
    "",
    `✅ *Confirmados (${input.confirmed.length}/${input.maxPlayers})*`,
    ...numbered(input.confirmed),
  ];

  const free = input.maxPlayers - input.confirmed.length;
  if (free > 0) lines.push(`_${free} ${free === 1 ? "vaga" : "vagas"}_`);

  if (input.waitlist.length) lines.push("", "⏳ *Lista de espera*", ...numbered(input.waitlist));
  if (input.maybe.length) lines.push("", `❓ *Talvez:* ${input.maybe.join(", ")}`);

  lines.push("", `Confirme pelo app: ${input.link}`);
  return lines.filter((l) => l !== null).join("\n");
}

function numbered(names: string[]) {
  return names.map((n, i) => `${i + 1}. ${n}`);
}
