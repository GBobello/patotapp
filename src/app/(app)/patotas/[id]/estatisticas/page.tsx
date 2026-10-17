import type { Metadata } from "next";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import { memberName } from "@/domain/members";
import { attendanceRate, playerStats } from "@/domain/stats";
import { parseStoredDraw } from "@/domain/teams";
import { db } from "@/server/db";
import { requireMember } from "@/server/patotas";

export const metadata: Metadata = { title: "Estatísticas" };

/** RF53: frequência, gols e resultados de cada integrante nos jogos com resultado registrado. */
export default async function StatsPage({ params }: PageProps<"/patotas/[id]/estatisticas">) {
  const { id } = await params;
  await requireMember(id);

  const [games, members] = await Promise.all([
    db.game.findMany({
      where: { patotaId: id, status: "SCHEDULED", resultSavedAt: { not: null } },
      include: { attendances: { select: { membershipId: true, attended: true, goals: true } } },
      orderBy: { startsAt: "asc" },
    }),
    db.membership.findMany({ where: { patotaId: id, status: "ACTIVE" }, include: { user: true } }),
  ]);

  if (games.length === 0) {
    return (
      <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", py: 4 }}>
        <QueryStatsIcon aria-hidden sx={{ fontSize: 48, color: "text.secondary" }} />
        <Typography>Ainda não há estatísticas.</Typography>
        <Typography variant="body2" color="text.secondary">
          Elas aparecem quando o organizador registra o resultado de um jogo (quem foi, gols e placar).
        </Typography>
      </Stack>
    );
  }

  const stats = playerStats(
    games.map((g) => ({
      teams: (parseStoredDraw(g.draw)?.teams ?? []).map((t) => t.members.map((m) => m.membershipId)),
      scores: g.teamScores,
      attended: g.attendances.filter((a) => a.attended).map((a) => a.membershipId),
      goals: Object.fromEntries(g.attendances.map((a) => [a.membershipId, a.goals])),
    })),
  );

  const rows = members
    .map((m) => {
      // Frequência considera só os jogos depois que a pessoa entrou na patota.
      const possible = games.filter((g) => g.startsAt >= m.createdAt).length;
      const s = stats.get(m.id) ?? { played: 0, wins: 0, draws: 0, losses: 0, goals: 0 };
      return { id: m.id, name: memberName(m), ...s, rate: attendanceRate(s.played, possible) };
    })
    .sort((a, b) => b.played - a.played || b.goals - a.goals || a.name.localeCompare(b.name, "pt-BR"));

  const scorers = rows.filter((r) => r.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 5);

  return (
    <Stack spacing={3}>
      <Typography color="text.secondary">
        Baseado em {games.length} {games.length === 1 ? "jogo com resultado registrado" : "jogos com resultado registrado"}.
      </Typography>

      {scorers.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }} component="section" aria-labelledby="artilheiros">
          <Typography id="artilheiros" variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
            Artilheiros
          </Typography>
          <ol style={{ margin: "8px 0 0", paddingLeft: 24 }}>
            {scorers.map((r) => (
              <li key={r.id}>
                {r.name} — {r.goals} {r.goals === 1 ? "gol" : "gols"}
              </li>
            ))}
          </ol>
        </Paper>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <caption>Jogos, frequência, gols, vitórias, empates e derrotas de cada integrante</caption>
          <TableHead>
            <TableRow>
              <TableCell>Jogador</TableCell>
              <TableCell align="right">Jogos</TableCell>
              <TableCell align="right">Frequência</TableCell>
              <TableCell align="right">Gols</TableCell>
              <TableCell align="right">
                <abbr title="Vitórias">V</abbr>
              </TableCell>
              <TableCell align="right">
                <abbr title="Empates">E</abbr>
              </TableCell>
              <TableCell align="right">
                <abbr title="Derrotas">D</abbr>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell component="th" scope="row">
                  {r.name}
                </TableCell>
                <TableCell align="right">{r.played}</TableCell>
                <TableCell align="right">{r.rate}%</TableCell>
                <TableCell align="right">{r.goals}</TableCell>
                <TableCell align="right">{r.wins}</TableCell>
                <TableCell align="right">{r.draws}</TableCell>
                <TableCell align="right">{r.losses}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
