// Regras puras sobre posições (sem banco, sem UI) — fáceis de testar.

export const POSITIONS = ["GOL", "ZAG", "LAT", "MEI", "ATA"] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  GOL: "Goleiro",
  ZAG: "Zagueiro",
  LAT: "Lateral",
  MEI: "Meio-campo",
  ATA: "Atacante",
};

export function isPosition(value: unknown): value is Position {
  return typeof value === "string" && (POSITIONS as readonly string[]).includes(value);
}

/** Remove a posição principal e duplicatas das secundárias, mantendo a ordem oficial. */
export function normalizeSecondaryPositions(
  primary: Position | null,
  secondary: readonly Position[],
): Position[] {
  const chosen = new Set(secondary);
  return POSITIONS.filter((p) => p !== primary && chosen.has(p));
}
