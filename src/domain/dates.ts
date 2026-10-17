// Datas sempre exibidas no horário de Brasília (sem horário de verão desde 2019: UTC−3).

export const TIME_ZONE = "America/Sao_Paulo";
const OFFSET = "-03:00";

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;

/** "2026-10-22" + "20:00" (horário de Brasília) → Date (UTC). */
export function fromLocalDateTime(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00${OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → { date: "2026-10-22", time: "20:00", weekday: 4 } no horário de Brasília. */
export function toLocalParts(d: Date) {
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  const iso = local.toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16), weekday: local.getUTCDay() };
}

/**
 * Próxima ocorrência do jogo recorrente (RF16) a partir de `now`.
 * Se hoje é o dia mas o horário já passou, vai para a semana seguinte.
 */
export function nextOccurrence(weekday: number, time: string, now: Date = new Date()): Date | null {
  const today = toLocalParts(now);
  const candidateToday = fromLocalDateTime(today.date, time);
  if (!candidateToday) return null;

  let days = (weekday - today.weekday + 7) % 7;
  if (days === 0 && candidateToday <= now) days = 7;
  return new Date(candidateToday.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Sugestão de data para o próximo jogo: padrão recorrente ou, sem padrão, daqui a 7 dias. */
export function suggestGameDate(weekday: number | null, time: string | null, now: Date = new Date()): Date {
  if (weekday !== null && time) return nextOccurrence(weekday, time, now) ?? now;
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});
const longDateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });

/** "qui., 23/10 às 20:00" */
export function formatGameDate(d: Date) {
  return `${dateFmt.format(d)} às ${timeFmt.format(d)}`;
}

/** "quinta-feira, 23 de outubro às 20:00" — versão por extenso, melhor para leitores de tela. */
export function formatGameDateLong(d: Date) {
  return `${longDateFmt.format(d)} às ${timeFmt.format(d)}`;
}

export function formatTime(d: Date) {
  return timeFmt.format(d);
}

/** Texto relativo curto: "hoje", "amanhã", "em 3 dias", "há 2 dias". */
export function relativeDay(d: Date, now: Date = new Date()) {
  const a = toLocalParts(d).date;
  const b = toLocalParts(now).date;
  const diff = Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  return diff > 0 ? `em ${diff} dias` : `há ${-diff} dias`;
}
