// Estatísticas dos jogadores (RF53) a partir dos jogos com resultado registrado (RF52).

export type GameResult = {
  /** Integrantes de cada time, na ordem do sorteio (vazio se não houve sorteio). */
  teams: string[][];
  /** Gols de cada time, na mesma ordem (vazio se o placar não foi registrado). */
  scores: number[];
  /** Quem compareceu. */
  attended: string[];
  goals: Record<string, number>;
};

export type PlayerStats = { played: number; wins: number; draws: number; losses: number; goals: number };

const empty = (): PlayerStats => ({ played: 0, wins: 0, draws: 0, losses: 0, goals: 0 });

/**
 * Resultado de cada time: o maior placar vence; empate no maior placar é empate para esses
 * times; os demais perdem. Sem placar completo, ninguém ganha nem perde.
 */
export function teamOutcomes(scores: number[], teamsCount: number): ("W" | "D" | "L")[] | null {
  if (teamsCount < 2 || scores.length !== teamsCount) return null;
  const max = Math.max(...scores);
  const leaders = scores.filter((s) => s === max).length;
  return scores.map((s) => (s < max ? "L" : leaders > 1 ? "D" : "W"));
}

export function playerStats(games: GameResult[]): Map<string, PlayerStats> {
  const stats = new Map<string, PlayerStats>();
  const get = (id: string) => {
    if (!stats.has(id)) stats.set(id, empty());
    return stats.get(id)!;
  };

  for (const game of games) {
    const present = new Set(game.attended);
    for (const id of present) {
      const s = get(id);
      s.played++;
      s.goals += game.goals[id] ?? 0;
    }

    const outcomes = teamOutcomes(game.scores, game.teams.length);
    if (!outcomes) continue;
    game.teams.forEach((team, i) => {
      for (const id of team) {
        if (!present.has(id)) continue;
        const s = get(id);
        if (outcomes[i] === "W") s.wins++;
        else if (outcomes[i] === "D") s.draws++;
        else s.losses++;
      }
    });
  }
  return stats;
}

/** Frequência em porcentagem inteira (0–100). */
export function attendanceRate(played: number, possible: number) {
  return possible > 0 ? Math.round((played / possible) * 100) : 0;
}
