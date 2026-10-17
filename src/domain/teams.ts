// Formato salvo do sorteio e textos dos times (RF34–RF36).

import { z } from "zod";
import { POSITIONS, POSITION_LABELS, type Position } from "./positions";

export const TEAM_NAMES = ["Time A", "Time B", "Time C", "Time D", "Time E", "Time F"] as const;

const storedDrawSchema = z.object({
  teams: z.array(
    z.object({
      members: z.array(z.object({ membershipId: z.string(), role: z.enum(POSITIONS).nullable() })),
    }),
  ),
  warnings: z.array(z.string()).default([]),
});

export type StoredDraw = z.infer<typeof storedDrawSchema>;

/** Lê o JSON salvo no jogo; formato inválido é tratado como "sem sorteio". */
export function parseStoredDraw(value: unknown): StoredDraw | null {
  const parsed = storedDrawSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Move um jogador para outro time (ajuste manual, RF34). */
export function moveMember(draw: StoredDraw, membershipId: string, toTeam: number): StoredDraw {
  if (toTeam < 0 || toTeam >= draw.teams.length) throw new Error("Time inválido.");
  let moved: StoredDraw["teams"][number]["members"][number] | undefined;
  const teams = draw.teams.map((t) => {
    const found = t.members.find((m) => m.membershipId === membershipId);
    if (found) moved = found;
    return { members: t.members.filter((m) => m.membershipId !== membershipId) };
  });
  if (!moved) throw new Error("Jogador não está no sorteio.");
  teams[toTeam].members.push(moved);
  return { ...draw, teams };
}

/** Texto dos times para o WhatsApp. */
export function teamsMessage(title: string, teams: { name: string; players: { name: string; role: Position | null }[] }[]) {
  const lines = [`⚽ *${title}*`];
  for (const team of teams) {
    lines.push("", `*${team.name}*`);
    for (const p of team.players) lines.push(`• ${p.name}${p.role ? ` (${POSITION_LABELS[p.role]})` : ""}`);
  }
  return lines.join("\n");
}
