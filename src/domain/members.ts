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
