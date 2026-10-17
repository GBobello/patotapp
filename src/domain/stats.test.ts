import { describe, expect, it } from "vitest";
import { type GameResult, attendanceRate, playerStats, teamOutcomes } from "./stats";

describe("teamOutcomes", () => {
  it("vitória, derrota e empate", () => {
    expect(teamOutcomes([3, 1], 2)).toEqual(["W", "L"]);
    expect(teamOutcomes([2, 2], 2)).toEqual(["D", "D"]);
    expect(teamOutcomes([1, 4, 4], 3)).toEqual(["L", "D", "D"]);
  });
  it("sem placar completo não há resultado", () => {
    expect(teamOutcomes([], 2)).toBeNull();
    expect(teamOutcomes([1], 2)).toBeNull();
  });
});

describe("playerStats (RF53)", () => {
  const games: GameResult[] = [
    { teams: [["a", "b"], ["c", "d"]], scores: [3, 1], attended: ["a", "b", "c", "d"], goals: { a: 2, c: 1 } },
    { teams: [["a", "c"], ["b", "d"]], scores: [2, 2], attended: ["a", "b", "c"], goals: { b: 2 } },
    { teams: [], scores: [], attended: ["a"], goals: {} },
  ];
  const s = playerStats(games);

  it("conta jogos, gols e resultados", () => {
    expect(s.get("a")).toEqual({ played: 3, wins: 1, draws: 1, losses: 0, goals: 2 });
    expect(s.get("b")).toEqual({ played: 2, wins: 1, draws: 1, losses: 0, goals: 2 });
    expect(s.get("c")).toEqual({ played: 2, wins: 0, draws: 1, losses: 1, goals: 1 });
  });

  it("quem faltou não ganha nem perde", () => {
    expect(s.get("d")).toEqual({ played: 1, wins: 0, draws: 0, losses: 1, goals: 0 });
  });

  it("frequência em porcentagem", () => {
    expect(attendanceRate(2, 3)).toBe(67);
    expect(attendanceRate(0, 0)).toBe(0);
  });
});
