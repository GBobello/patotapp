import { describe, expect, it } from "vitest";
import { DrawError, drawTeams, positionCounts, seededRandom, type DrawPlayer } from "./draw";
import { POSITIONS, type Position } from "./positions";

let nextId = 0;
const p = (primary: Position | null, rating = 3, secondary: Position[] = []): DrawPlayer => ({
  id: `p${nextId++}`,
  rating,
  primary,
  secondary,
});
const many = (n: number, pos: Position | null, rating = 3) => Array.from({ length: n }, () => p(pos, rating));

const keepersPerTeam = (r: ReturnType<typeof drawTeams>) => r.teams.map((t) => positionCounts(t).GOL).sort();

describe("drawTeams — goleiros (RN05)", () => {
  it("2 times e 2 goleiros: um goleiro em cada time", () => {
    const r = drawTeams([...many(2, "GOL"), ...many(8, "MEI")], { teamsCount: 2, random: seededRandom(1) });
    expect(keepersPerTeam(r)).toEqual([1, 1]);
  });

  it("2 times e 3 goleiros: só então um time pode ter 2 goleiros", () => {
    const r = drawTeams([...many(3, "GOL"), ...many(9, "MEI")], { teamsCount: 2, random: seededRandom(2) });
    expect(keepersPerTeam(r)).toEqual([1, 2]);
  });

  it("falta goleiro: usa quem tem goleiro como posição secundária (RF32)", () => {
    const backup = p("ZAG", 3, ["GOL"]);
    const r = drawTeams([p("GOL"), backup, ...many(8, "MEI")], { teamsCount: 2, random: seededRandom(3) });
    expect(keepersPerTeam(r)).toEqual([1, 1]);
    expect(r.warnings).toEqual([]);
  });

  it("falta goleiro sem substituto: avisa e não junta goleiros", () => {
    const r = drawTeams([p("GOL"), ...many(9, "MEI")], { teamsCount: 2, random: seededRandom(4) });
    expect(keepersPerTeam(r)).toEqual([0, 1]);
    expect(r.warnings[0]).toMatch(/Falta 1 goleiro/);
  });
});

describe("drawTeams — posições (RN06)", () => {
  it("nunca forma um time só de zagueiros", () => {
    const r = drawTeams([...many(6, "ZAG"), ...many(6, "ATA")], { teamsCount: 2, random: seededRandom(5) });
    for (const team of r.teams) {
      expect(positionCounts(team).ZAG).toBe(3);
      expect(positionCounts(team).ATA).toBe(3);
    }
  });

  it("3 times dividem cada posição com diferença máxima de 1", () => {
    const players = [...many(3, "GOL"), ...many(4, "ZAG"), ...many(5, "MEI"), ...many(3, "ATA")];
    const r = drawTeams(players, { teamsCount: 3, random: seededRandom(6) });
    for (const pos of POSITIONS) {
      const counts = r.teams.map((t) => positionCounts(t)[pos]);
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
  });
});

describe("drawTeams — equilíbrio (RN07)", () => {
  it("equilibra as notas: craques não ficam todos juntos", () => {
    const players = [p("GOL", 3), p("GOL", 3), ...many(4, "MEI", 5), ...many(4, "MEI", 1)];
    const r = drawTeams(players, { teamsCount: 2, random: seededRandom(7) });
    expect(r.spread).toBe(0);
    for (const team of r.teams) expect(team.players.filter((x) => x.rating === 5)).toHaveLength(2);
  });

  it("com número ímpar, o craque vai para o time com um jogador a menos", () => {
    // 7 jogadores, todos nota 3 exceto um meia nota 5 (caso real encontrado no teste com usuários).
    const players = [p("GOL"), p("ZAG"), p("ZAG"), p("LAT"), p("MEI", 5), p("ATA"), p("ATA")];
    for (const seed of [1, 2, 3, 4, 5]) {
      const r = drawTeams(players, { teamsCount: 2, random: seededRandom(seed) });
      expect(r.spread).toBe(1);
      const craqueTeam = r.teams.find((t) => t.players.some((x) => x.rating === 5))!;
      expect(craqueTeam.players).toHaveLength(3);
    }
  });

  it("sorteios diferentes geram times diferentes", () => {
    const players = [...many(2, "GOL"), ...many(4, "ZAG"), ...many(4, "MEI"), ...many(4, "ATA")];
    const signature = (seed: number) =>
      drawTeams(players, { teamsCount: 2, random: seededRandom(seed) })
        .teams.map((t) => t.players.map((x) => x.id).sort().join(","))
        .sort()
        .join("|");
    const results = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(signature));
    expect(results.size).toBeGreaterThan(1);
  });
});

describe("drawTeams — propriedades em elencos aleatórios", () => {
  it("tamanho dos times e cada posição variam no máximo 1; ninguém some ou repete", () => {
    const rnd = seededRandom(99);
    const options: (Position | null)[] = [...POSITIONS, null];

    for (let round = 0; round < 150; round++) {
      const teamsCount = 2 + Math.floor(rnd() * 3);
      const size = teamsCount * 2 + Math.floor(rnd() * 14);
      const players = Array.from({ length: size }, () =>
        p(options[Math.floor(rnd() * options.length)], 1 + Math.floor(rnd() * 5)),
      );

      const r = drawTeams(players, { teamsCount, random: rnd, attempts: 10 });

      const sizes = r.teams.map((t) => t.players.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      for (const pos of [...POSITIONS, "SEM"] as const) {
        const counts = r.teams.map((t) => positionCounts(t)[pos]);
        expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
      }
      const ids = r.teams.flatMap((t) => t.players.map((x) => x.id)).sort();
      expect(ids).toEqual(players.map((x) => x.id).sort());
      for (const t of r.teams) expect(t.total).toBe(t.players.reduce((s, x) => s + x.rating, 0));
    }
  });
});

describe("drawTeams — posições secundárias (RF32)", () => {
  it("completa a zaga com quem joga de zagueiro como secundária", () => {
    const players = [p("GOL"), p("GOL"), p("ZAG"), p("MEI", 3, ["ZAG"]), p("MEI"), p("MEI"), p("ATA"), p("ATA")];
    const r = drawTeams(players, { teamsCount: 2, random: seededRandom(11) });
    for (const team of r.teams) expect(positionCounts(team).ZAG).toBe(1);
    const improvised = r.teams.flatMap((t) => t.players).find((x) => x.primary === "MEI" && x.role === "ZAG");
    expect(improvised).toBeDefined();
  });

  it("não desfalca uma posição que só cobre os times na conta", () => {
    // 2 meias para 2 times: o meia que também joga de zagueiro precisa continuar meia.
    const players = [p("GOL"), p("GOL"), p("ZAG"), p("MEI", 3, ["ZAG"]), p("MEI"), p("ATA"), p("ATA"), p("ATA")];
    const r = drawTeams(players, { teamsCount: 2, random: seededRandom(12) });
    for (const team of r.teams) expect(positionCounts(team).MEI).toBe(1);
  });
});

describe("drawTeams — juntos e separados (RF33)", () => {
  const roster = () => [p("GOL", 3), p("GOL", 3), ...many(4, "ZAG", 3), ...many(4, "MEI", 3), ...many(4, "ATA", 3)];

  it("mantém juntos quem pediu para jogar junto", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const players = roster();
      const [a, b] = [players[2].id, players[10].id]; // um zagueiro e um atacante
      const r = drawTeams(players, { teamsCount: 2, random: seededRandom(seed), together: [[a, b]] });
      const teamOf = (id: string) => r.teams.findIndex((t) => t.players.some((x) => x.id === id));
      expect(teamOf(a)).toBe(teamOf(b));
      expect(r.violations).toBe(0);
    }
  });

  it("separa quem precisa ficar em times diferentes", () => {
    for (const seed of [6, 7, 8]) {
      const players = roster();
      const [a, b] = [players[6].id, players[7].id]; // dois meias
      const r = drawTeams(players, { teamsCount: 2, random: seededRandom(seed), apart: [[a, b]] });
      const teamOf = (id: string) => r.teams.findIndex((t) => t.players.some((x) => x.id === id));
      expect(teamOf(a)).not.toBe(teamOf(b));
    }
  });

  it("avisa quando a regra é impossível sem quebrar as posições", () => {
    const players = roster();
    // Os dois goleiros juntos obrigaria um time sem goleiro: a regra de posição vence.
    const r = drawTeams(players, { teamsCount: 2, random: seededRandom(9), together: [[players[0].id, players[1].id]] });
    expect(r.violations).toBe(1);
    expect(r.warnings.join(" ")).toMatch(/não pôde ser cumprida/);
  });

  it("ignora regras de quem não confirmou", () => {
    const players = roster();
    const r = drawTeams(players, { teamsCount: 2, random: seededRandom(10), together: [[players[2].id, "ausente"]] });
    expect(r.violations).toBe(0);
  });
});

describe("drawTeams — validações (RN04)", () => {
  it("exige pelo menos 2 jogadores por time", () => {
    expect(() => drawTeams(many(3, "MEI"), { teamsCount: 2 })).toThrow(DrawError);
  });
});
