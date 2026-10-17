import type { Metadata } from "next";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import GroupsIcon from "@mui/icons-material/Groups";
import { GameCard } from "@/components/game-card";
import { JoinByCodeForm } from "@/components/join-by-code-form";
import { LinkButton, LinkCardActionArea } from "@/components/links";
import { ROLE_LABELS } from "@/domain/roles";
import { db } from "@/server/db";
import { attendanceSummarySelect, summarizeGame, upcomingWhere } from "@/server/games";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Painel" };

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = (user.nickname ?? user.name ?? "").split(" ")[0];
  const profileIncomplete = !user.name || !user.primaryPosition;

  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { patota: { include: { _count: { select: { memberships: true } } } } },
    orderBy: { patota: { name: "asc" } },
  });

  // RF50: o próximo jogo de cada patota, com a minha situação.
  const upcoming = await db.game.findMany({
    where: { patotaId: { in: memberships.map((m) => m.patotaId) }, status: "SCHEDULED", ...upcomingWhere() },
    include: attendanceSummarySelect,
    orderBy: { startsAt: "asc" },
  });
  const seen = new Set<string>();
  const nextGames = upcoming
    .filter((g) => !seen.has(g.patotaId) && seen.add(g.patotaId))
    .map((g) => {
      const m = memberships.find((x) => x.patotaId === g.patotaId)!;
      return summarizeGame(g, m.id, m.patota.name);
    });

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">
        {firstName ? `Olá, ${firstName}!` : "Olá!"}
      </Typography>

      {profileIncomplete && (
        <Alert
          severity="info"
          action={
            <LinkButton href="/perfil" color="inherit">
              Completar
            </LinkButton>
          }
        >
          Complete seu perfil com nome e posição para entrar no sorteio dos times.
        </Alert>
      )}

      {nextGames.length > 0 && (
        <Stack spacing={2} component="section" aria-labelledby="proximos-jogos">
          <Typography id="proximos-jogos" variant="h5" component="h2">
            Próximos jogos
          </Typography>
          {nextGames.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </Stack>
      )}

      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" component="h2">
          Minhas patotas
        </Typography>
        <LinkButton href="/patotas/nova" variant="contained" startIcon={<AddIcon />}>
          Criar patota
        </LinkButton>
      </Stack>

      {memberships.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center", py: 3 }}>
              <GroupsIcon aria-hidden sx={{ fontSize: 56, color: "text.secondary" }} />
              <Typography variant="h6" component="h3">
                Você ainda não está em nenhuma patota
              </Typography>
              <Typography color="text.secondary">
                Crie uma patota ou entre em uma usando o link de convite que o organizador mandou.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack component="ul" spacing={1.5} sx={{ listStyle: "none", p: 0, m: 0 }}>
          {memberships.map(({ patota, role }) => (
            <li key={patota.id}>
              <Card variant="outlined">
                <LinkCardActionArea href={`/patotas/${patota.id}`}>
                  <CardContent>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                      <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                        {patota.name}
                      </Typography>
                      <Chip size="small" label={ROLE_LABELS[role]} />
                    </Stack>
                    <Typography color="text.secondary">
                      {patota._count.memberships} {patota._count.memberships === 1 ? "integrante" : "integrantes"}
                      {patota.location ? ` · ${patota.location}` : ""}
                    </Typography>
                  </CardContent>
                </LinkCardActionArea>
              </Card>
            </li>
          ))}
        </Stack>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" component="h2" gutterBottom>
          Recebeu um convite?
        </Typography>
        <JoinByCodeForm />
      </Paper>
    </Stack>
  );
}
