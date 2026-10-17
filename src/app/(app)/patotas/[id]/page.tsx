import type { Metadata } from "next";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import { GameCard } from "@/components/game-card";
import { InviteCard } from "@/components/invite-card";
import { LinkButton } from "@/components/links";
import { ListItemLink } from "@/components/list-item-link";
import { formatGameDate } from "@/domain/dates";
import { canManage } from "@/domain/roles";
import { db } from "@/server/db";
import { attendanceSummarySelect, summarizeGame, upcomingWhere } from "@/server/games";
import { requireMember } from "@/server/patotas";

export async function generateMetadata({ params }: PageProps<"/patotas/[id]">): Promise<Metadata> {
  const { patota } = await requireMember((await params).id);
  return { title: patota.name };
}

export default async function PatotaHomePage({ params }: PageProps<"/patotas/[id]">) {
  const { id } = await params;
  const { patota, membership } = await requireMember(id);
  const manager = canManage(membership.role);

  const [upcoming, past] = await Promise.all([
    db.game.findMany({
      where: { patotaId: id, ...upcomingWhere() },
      include: attendanceSummarySelect,
      orderBy: { startsAt: "asc" },
      take: 4,
    }),
    db.game.findMany({
      where: { patotaId: id, startsAt: { lt: upcomingWhere().startsAt.gte } },
      orderBy: { startsAt: "desc" },
      take: 5,
      include: { _count: { select: { attendances: { where: { status: "CONFIRMED" } } } } },
    }),
  ]);

  return (
    <Stack spacing={3}>
      {patota.description && <Typography>{patota.description}</Typography>}

      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" component="h2">
          Próximos jogos
        </Typography>
        {manager && (
          <LinkButton href={`/patotas/${id}/jogos/novo`} variant="contained" startIcon={<AddIcon />}>
            Novo jogo
          </LinkButton>
        )}
      </Stack>

      {upcoming.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", py: 2 }}>
              <EventBusyIcon aria-hidden sx={{ fontSize: 48, color: "text.secondary" }} />
              <Typography>Nenhum jogo marcado.</Typography>
              <Typography variant="body2" color="text.secondary">
                {manager ? "Crie o próximo jogo para a galera confirmar." : "Assim que o organizador marcar, aparece aqui."}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {upcoming.map((g) => (
            <GameCard key={g.id} game={summarizeGame(g, membership.id)} />
          ))}
        </Stack>
      )}

      {past.length > 0 && (
        <Paper variant="outlined" component="section" aria-labelledby="jogos-anteriores">
          <Typography id="jogos-anteriores" variant="subtitle1" component="h2" sx={{ px: 2, pt: 1.5, fontWeight: 600 }}>
            Jogos anteriores
          </Typography>
          <List>
            {past.map((g) => (
              <ListItemLink key={g.id} href={`/patotas/${id}/jogos/${g.id}`}>
                <ListItemText
                  primary={formatGameDate(g.startsAt)}
                  secondary={g.status === "CANCELLED" ? "Cancelado" : `${g._count.attendances} jogadores`}
                />
              </ListItemLink>
            ))}
          </List>
        </Paper>
      )}

      {manager && <InviteCard patota={patota} />}
    </Stack>
  );
}
