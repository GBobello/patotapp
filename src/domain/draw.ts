// Sorteio de times balanceado por nota e posição (RF29–RF32, RN04–RN07).
//
// Ideia geral:
//   1. Separa os jogadores em grupos por posição (goleiros primeiro).
//   2. Distribui cada grupo do mais forte para o mais fraco, sempre no time que tem menos
//      jogadores daquele grupo (e, no empate, menos jogadores no total e menor soma de notas).
//      Isso garante diferença máxima de 1 por posição entre os times.
//   3. Melhora o equilíbrio trocando jogadores da MESMA posição entre times (busca local),
//      o que nunca quebra a regra das posições.
//   4. Repete com embaralhamentos diferentes e sorteia entre os melhores resultados,
//      para os times não serem sempre iguais (RN07).

import { POSITIONS, type Position } from "./positions";

export type DrawPlayer = {
  id: string;
  rating: number;
  primary: Position | null;
  secondary: Position[];
};

export type DrawnPlayer = DrawPlayer & {
  /** Posição usada no sorteio (pode vir das secundárias, ex.: goleiro improvisado). */
  role: Position | null;
};

export type DrawTeam = { players: DrawnPlayer[]; total: number };

export type DrawResult = {
  teams: DrawTeam[];
  /** Diferença entre a maior e a menor soma de notas. */
  spread: number;
  /** Regras juntos/separados que não puderam ser cumpridas. */
  violations: number;
  warnings: string[];
};

export type DrawOptions = {
  teamsCount: number;
  /** Gerador aleatório em [0, 1) — injetável para testes determinísticos. */
  random?: () => number;
  attempts?: number;
  /** RF33: pares que devem ficar no mesmo time (ex.: pai e filho que vão juntos de carro). */
  together?: [string, string][];
  /** RF33: pares que devem ficar em times diferentes (ex.: os dois melhores goleiros). */
  apart?: [string, string][];
};

type Constraints = { together: [string, string][]; apart: [string, string][] };

/** Peso de uma regra descumprida: qualquer regra vale mais que toda a diferença de notas. */
const VIOLATION_COST = 10_000;

const GROUP_ORDER: (Position | null)[] = ["GOL", "ZAG", "LAT", "MEI", "ATA", null];

export class DrawError extends Error {}

export function drawTeams(players: DrawPlayer[], options: DrawOptions): DrawResult {
  const { teamsCount, random = Math.random, attempts = 60 } = options;
  const present = new Set(players.map((p) => p.id));
  // Regras só valem quando as duas pessoas estão confirmadas.
  const relevant = (pairs: [string, string][] = []) => pairs.filter(([a, b]) => a !== b && present.has(a) && present.has(b));
  const constraints: Constraints = { together: relevant(options.together), apart: relevant(options.apart) };

  if (teamsCount < 2) throw new DrawError("O sorteio precisa de pelo menos 2 times.");
  if (players.length < teamsCount * 2) {
    throw new DrawError(`São necessários pelo menos ${teamsCount * 2} confirmados para ${teamsCount} times.`);
  }

  const { assigned, warnings } = assignRoles(players, teamsCount);

  let best: DrawResult[] = [];
  let bestCost = Infinity;
  for (let i = 0; i < attempts; i++) {
    const teams = improve(distribute(assigned, teamsCount, random), constraints);
    const violations = countViolations(teams, constraints);
    const result = { teams, spread: spreadOf(teams), violations, warnings };
    const c = cost(teams, constraints);
    if (c < bestCost) {
      best = [result];
      bestCost = c;
    } else if (c === bestCost) best.push(result);
  }

  const chosen = best[Math.floor(random() * best.length)];
  if (chosen.violations > 0) {
    chosen.warnings = [
      ...warnings,
      chosen.violations === 1
        ? "Uma regra de juntos/separados não pôde ser cumprida sem desequilibrar as posições."
        : `${chosen.violations} regras de juntos/separados não puderam ser cumpridas sem desequilibrar as posições.`,
    ];
  }
  return chosen;
}

/**
 * Define a posição de cada jogador no sorteio. Se faltarem goleiros, usa quem tem
 * goleiro como posição secundária (RF32); se ainda faltar, avisa (RN05).
 */
export function assignRoles(players: DrawPlayer[], teamsCount: number) {
  const warnings: string[] = [];
  const assigned: DrawnPlayer[] = players.map((p) => ({ ...p, role: p.primary }));

  let keepers = assigned.filter((p) => p.role === "GOL").length;
  if (keepers < teamsCount) {
    const backups = assigned
      .filter((p) => p.role !== "GOL" && p.secondary.includes("GOL"))
      .sort((a, b) => b.rating - a.rating);
    for (const b of backups.slice(0, teamsCount - keepers)) {
      b.role = "GOL";
      keepers++;
    }
  }
  if (keepers < teamsCount) {
    const missing = teamsCount - keepers;
    warnings.push(
      missing === 1
        ? "Falta 1 goleiro: um time vai começar sem goleiro fixo."
        : `Faltam ${missing} goleiros: ${missing} times vão começar sem goleiro fixo.`,
    );
  }

  fillLinePositions(assigned, teamsCount);
  return { assigned, warnings };
}

const LINE_ROLES: Position[] = ["ZAG", "LAT", "MEI", "ATA"];

/**
 * RF32: se uma posição de linha tem menos jogadores que times (algum time ficaria sem ela),
 * completa com quem joga essa posição como secundária — vindo de uma posição que tem sobra —
 * ou com quem não cadastrou posição. Assim nenhum time fica sem zagueiro enquanto houver
 * alguém que possa jogar ali.
 */
export function fillLinePositions(assigned: DrawnPlayer[], teamsCount: number) {
  const count = (role: Position | null) => assigned.filter((p) => p.role === role).length;
  // Só completa posições que alguém do grupo realmente joga (como principal ou secundária).
  const wanted = LINE_ROLES.filter((r) => assigned.some((p) => p.primary === r || p.secondary.includes(r)));

  for (const role of wanted) {
    while (count(role) < teamsCount) {
      const donors = assigned
        .filter((p) => {
          if (p.role === role || p.role === "GOL") return false;
          if (p.role === null) return true; // sem posição cadastrada: pode completar
          // Só tira de uma posição que continua cobrindo todos os times.
          return p.secondary.includes(role) && count(p.role) > teamsCount;
        })
        // Prefere quem joga a posição como secundária, depois quem está na posição com mais sobra.
        .sort(
          (a, b) =>
            Number(b.secondary.includes(role)) - Number(a.secondary.includes(role)) ||
            count(b.role) - count(a.role),
        );
      if (!donors.length) break;
      donors[0].role = role;
    }
  }
}

function distribute(players: DrawnPlayer[], teamsCount: number, random: () => number): DrawTeam[] {
  const teams: DrawTeam[] = Array.from({ length: teamsCount }, () => ({ players: [], total: 0 }));

  for (const group of GROUP_ORDER) {
    // Embaralha antes de ordenar: jogadores com a mesma nota caem em ordem aleatória.
    const members = shuffle(
      players.filter((p) => p.role === group),
      random,
    ).sort((a, b) => b.rating - a.rating);

    for (const player of members) {
      const countIn = (t: DrawTeam) => t.players.filter((p) => p.role === group).length;
      const minCount = Math.min(...teams.map(countIn));
      const candidates = teams.filter((t) => countIn(t) === minCount);
      const minSize = Math.min(...candidates.map((t) => t.players.length));
      const smallest = candidates.filter((t) => t.players.length === minSize);
      const minTotal = Math.min(...smallest.map((t) => t.total));
      const weakest = smallest.filter((t) => t.total === minTotal);
      const team = weakest[Math.floor(random() * weakest.length)];

      team.players.push(player);
      team.total += player.rating;
    }
  }
  return teams;
}

/**
 * Busca local: troca dois jogadores entre times, ou move um jogador do time maior para o menor,
 * sempre que isso diminuir a diferença de notas sem quebrar as regras de posição e tamanho.
 * Trocar posições diferentes é permitido quando cada posição continua com diferença ≤ 1
 * (ex.: com 7 jogadores, o craque pode ir para o time que tem um jogador a menos).
 */
function improve(teams: DrawTeam[], constraints: Constraints): DrawTeam[] {
  let improved = true;
  let guard = 0;

  while (improved && guard++ < 500) {
    improved = false;
    const current = cost(teams, constraints);

    outer: for (let a = 0; a < teams.length; a++) {
      for (let b = 0; b < teams.length; b++) {
        if (a === b) continue;
        const ta = teams[a];
        const tb = teams[b];

        for (const pa of [...ta.players]) {
          // Mover (só do time maior para o menor, mantendo tamanhos com diferença ≤ 1).
          if (ta.players.length > tb.players.length) {
            move(ta, pa, tb);
            if (isBalanced(teams) && cost(teams, constraints) < current) {
              improved = true;
              break outer;
            }
            move(tb, pa, ta);
          }

          // Trocar.
          if (a > b) continue; // cada par de times uma vez
          for (const pb of [...tb.players]) {
            swap(ta, pa, tb, pb);
            if ((pa.role === pb.role || isBalanced(teams)) && cost(teams, constraints) < current) {
              improved = true;
              break outer;
            }
            swap(ta, pb, tb, pa);
          }
        }
      }
    }
  }
  return teams;
}

function swap(ta: DrawTeam, pa: DrawnPlayer, tb: DrawTeam, pb: DrawnPlayer) {
  ta.players[ta.players.indexOf(pa)] = pb;
  tb.players[tb.players.indexOf(pb)] = pa;
  ta.total += pb.rating - pa.rating;
  tb.total += pa.rating - pb.rating;
}

function move(from: DrawTeam, player: DrawnPlayer, to: DrawTeam) {
  from.players.splice(from.players.indexOf(player), 1);
  to.players.push(player);
  from.total -= player.rating;
  to.total += player.rating;
}

/** Regras juntos/separados descumpridas. */
function countViolations(teams: DrawTeam[], { together, apart }: Constraints) {
  if (!together.length && !apart.length) return 0;
  const teamOf = new Map<string, number>();
  teams.forEach((t, i) => t.players.forEach((p) => teamOf.set(p.id, i)));
  return (
    together.filter(([a, b]) => teamOf.get(a) !== teamOf.get(b)).length +
    apart.filter(([a, b]) => teamOf.get(a) === teamOf.get(b)).length
  );
}

/** O que a busca minimiza: primeiro cumprir as regras, depois equilibrar as notas. */
function cost(teams: DrawTeam[], constraints: Constraints) {
  return countViolations(teams, constraints) * VIOLATION_COST + spreadOf(teams);
}

/** RN06: tamanhos e cada posição com diferença máxima de 1 entre os times. */
function isBalanced(teams: DrawTeam[]) {
  const within1 = (values: number[]) => Math.max(...values) - Math.min(...values) <= 1;
  if (!within1(teams.map((t) => t.players.length))) return false;
  return GROUP_ORDER.every((role) => within1(teams.map((t) => t.players.filter((p) => p.role === role).length)));
}

export function spreadOf(teams: { total: number }[]) {
  const totals = teams.map((t) => t.total);
  return Math.max(...totals) - Math.min(...totals);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Gerador pseudoaleatório com semente (mulberry32), usado nos testes. */
export function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Quantos jogadores de cada posição há em cada time — usado em testes e na tela. */
export function positionCounts(team: DrawTeam) {
  const counts = Object.fromEntries([...POSITIONS, "SEM"].map((p) => [p, 0])) as Record<Position | "SEM", number>;
  for (const p of team.players) counts[p.role ?? "SEM"]++;
  return counts;
}
