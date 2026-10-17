// Integrantes podem ser usuários com conta ou convidados sem conta (RF13).
// Estas funções escondem essa diferença do resto do app.

import type { Position } from "./positions";

export type MemberLike = {
  guestName: string | null;
  guestPosition: Position | null;
  user: {
    nickname: string | null;
    name: string | null;
    email: string;
    image: string | null;
    primaryPosition: Position | null;
    secondaryPositions: Position[];
  } | null;
};

/** Nome exibido: apelido > nome > início do e-mail; convidado usa o nome cadastrado. */
export function memberName(m: MemberLike): string {
  if (!m.user) return m.guestName ?? "Convidado";
  return m.user.nickname || m.user.name || m.user.email.split("@")[0];
}

export function memberImage(m: MemberLike): string | null {
  return m.user?.image ?? null;
}

export function memberPositions(m: MemberLike): { primary: Position | null; secondary: Position[] } {
  if (!m.user) return { primary: m.guestPosition, secondary: [] };
  return { primary: m.user.primaryPosition, secondary: m.user.secondaryPositions };
}

export function isGuest(m: { user: unknown }) {
  return m.user === null;
}

export const RATING_LABELS: Record<number, string> = {
  1: "Iniciante",
  2: "Regular",
  3: "Bom",
  4: "Muito bom",
  5: "Craque",
};

/** Mínimo de avaliações da galera para a média entrar na nota do sorteio (RF28). */
export const MIN_PEER_VOTES = 3;

/**
 * RF28: nota usada no sorteio. Com pelo menos MIN_PEER_VOTES avaliações dos colegas,
 * vale a média entre a nota do organizador e a média da galera (uma casa decimal);
 * com menos votos, vale só a nota do organizador (poucos votos distorcem).
 */
export function effectiveRating(organizerRating: number, peerRatings: number[]): number {
  if (peerRatings.length < MIN_PEER_VOTES) return organizerRating;
  const peerAvg = peerRatings.reduce((s, r) => s + r, 0) / peerRatings.length;
  return Math.round(((organizerRating + peerAvg) / 2) * 10) / 10;
}

export function average(values: number[]): number | null {
  return values.length ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : null;
}
