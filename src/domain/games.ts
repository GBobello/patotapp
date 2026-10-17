// Regras de agenda dos jogos (RF16, RF17, RF19) — funções puras e testáveis.

import { nextOccurrence } from "./dates";

const HOUR = 60 * 60 * 1000;

/** Prazo de confirmação e abertura das vagas para diaristas, a partir do horário do jogo. */
export function gameDeadlines(startsAt: Date, deadlineHours: number, diaristaWindowHours: number | null) {
  return {
    confirmationDeadline: new Date(startsAt.getTime() - deadlineHours * HOUR),
    diaristasOpenAt: diaristaWindowHours === null ? null : new Date(startsAt.getTime() - diaristaWindowHours * HOUR),
  };
}

/** Horas de antecedência do prazo de um jogo existente (para preencher o formulário de edição). */
export function deadlineHoursOf(startsAt: Date, confirmationDeadline: Date) {
  return Math.max(0, Math.round((startsAt.getTime() - confirmationDeadline.getTime()) / HOUR));
}

/**
 * Quando as vagas diminuem abaixo do número de confirmados, os que confirmaram por último
 * voltam para a lista de espera (ninguém é removido sem aviso).
 */
export function demotions(confirmed: { membershipId: string; since: Date }[], maxPlayers: number): string[] {
  const excess = confirmed.length - maxPlayers;
  if (excess <= 0) return [];
  return [...confirmed]
    .sort((a, b) => b.since.getTime() - a.since.getTime())
    .slice(0, excess)
    .map((c) => c.membershipId);
}

/**
 * RF16: data do próximo jogo a criar automaticamente, ou null se não for o caso
 * (opção desligada, sem padrão semanal, ou já existe jogo marcado).
 */
export function nextAutoGameDate(
  patota: { autoCreateGames: boolean; defaultWeekday: number | null; defaultTime: string | null },
  hasUpcomingGame: boolean,
  now: Date = new Date(),
): Date | null {
  if (!patota.autoCreateGames || hasUpcomingGame) return null;
  if (patota.defaultWeekday === null || !patota.defaultTime) return null;
  return nextOccurrence(patota.defaultWeekday, patota.defaultTime, now);
}
