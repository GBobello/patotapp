import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CasinoIcon from "@mui/icons-material/Casino";
import { drawGameTeams, publishDraw } from "@/app/(app)/patotas/[id]/jogos/actions";
import { spreadOf } from "@/domain/draw";
import { POSITION_LABELS, type Position } from "@/domain/positions";
import { teamName, teamsMessage, type StoredDraw } from "@/domain/teams";
import { ActionButton } from "./action-button";
import { MovePlayerMenu } from "./move-player-menu";
import { CopyButton, WhatsAppButton } from "./share-buttons";

export type TeamMemberInfo = { name: string; rating: number; primary: Position | null };

type Props = {
  gameId: string;
  title: string;
  draw: StoredDraw | null;
  published: boolean;
  manager: boolean;
  teamsCount: number;
  confirmedIds: string[];
  members: Map<string, TeamMemberInfo>;
  /** RF36: nomes/coletes definidos pela patota. */
  teamNames?: string[];
};

/** Notas podem ter uma casa decimal quando a avaliação da galera entra (RF28). */
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));

function balanceLabel(spread: number) {
  if (spread <= 1) return { text: "Times equilibrados", color: "success" as const };
  if (spread <= 3) return { text: "Pequena diferença", color: "warning" as const };
  return { text: "Times desequilibrados — sorteie de novo ou ajuste", color: "error" as const };
}

/** Seção de times do jogo: sorteio, indicador de equilíbrio, ajustes e publicação (RF29–RF35). */
export function TeamsSection({
  gameId,
  title,
  draw,
  published,
  manager,
  teamsCount,
  confirmedIds,
  members,
  teamNames = [],
}: Props) {
  if (!manager && !published) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }} component="section" aria-labelledby="times-titulo">
        <Typography id="times-titulo" variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
          Times
        </Typography>
        <Typography color="text.secondary">Os times aparecem aqui quando o organizador publicar o sorteio.</Typography>
      </Paper>
    );
  }

  const enough = confirmedIds.length >= teamsCount * 2;
  const teams = (draw?.teams ?? []).map((t, i) => {
    const players = t.members.map((m) => {
      const info = members.get(m.membershipId);
      return {
        membershipId: m.membershipId,
        name: info?.name ?? "Ex-integrante",
        rating: info?.rating ?? 0,
        role: m.role,
        improvised: m.role !== null && info?.primary !== m.role,
      };
    });
    return { name: teamName(i, teamNames), players, total: players.reduce((s, p) => s + p.rating, 0) };
  });

  const drawnIds = new Set(teams.flatMap((t) => t.players.map((p) => p.membershipId)));
  const stale = draw !== null && (drawnIds.size !== confirmedIds.length || confirmedIds.some((id) => !drawnIds.has(id)));
  const balance = balanceLabel(spreadOf(teams));
  const share = teamsMessage(title, teams);

  return (
    <Stack spacing={2} component="section" aria-labelledby="times-titulo">
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Typography id="times-titulo" variant="h6" component="h3">
          Times
        </Typography>
        {manager && draw && (
          <Chip label={published ? "Publicado" : "Rascunho — só organizadores veem"} color={published ? "success" : "default"} />
        )}
      </Stack>

      {manager && !enough && (
        <Alert severity="info">
          Para sortear {teamsCount} times são necessários pelo menos {teamsCount * 2} confirmados (hoje: {confirmedIds.length}).
        </Alert>
      )}
      {manager && stale && (
        <Alert severity="warning">A lista de confirmados mudou depois do sorteio. Sorteie de novo ou ajuste os times.</Alert>
      )}
      {draw?.warnings.map((w) => (
        <Alert key={w} severity="warning">
          {w}
        </Alert>
      ))}

      {manager && draw && (
        <Alert severity={balance.color} icon={false}>
          <strong>{balance.text}.</strong> Diferença entre a maior e a menor soma de notas: {fmt(spreadOf(teams))}{" "}
          {spreadOf(teams) === 1 ? "ponto" : "pontos"}.
        </Alert>
      )}

      {teams.length > 2 && (
        <Alert severity="info" icon={false}>
          Com {teams.length} times: <strong>{teams[0].name}</strong> e <strong>{teams[1].name}</strong> começam jogando; os
          outros ficam de fora e entram, na ordem, no lugar de quem perder.
        </Alert>
      )}

      {teams.length > 0 && (
        <Grid container spacing={2}>
          {teams.map((team, ti) => (
            <Grid key={team.name} size={{ xs: 12, sm: teams.length === 2 ? 6 : 4 }}>
              <Card variant="outlined" component="section" aria-labelledby={`time-${ti}`}>
                <CardContent>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
                    <Typography id={`time-${ti}`} variant="subtitle1" component="h4" sx={{ fontWeight: 700 }}>
                      {team.name}
                    </Typography>
                    {teams.length > 2 && (
                      <Chip
                        size="small"
                        variant={ti < 2 ? "filled" : "outlined"}
                        label={ti < 2 ? "Começa jogando" : `De fora (${ti - 1}º a entrar)`}
                      />
                    )}
                    {manager && (
                      <Typography variant="body2" color="text.secondary">
                        Soma {fmt(team.total)} · média {(team.total / Math.max(1, team.players.length)).toFixed(1)}
                      </Typography>
                    )}
                  </Stack>
                  <List dense>
                    {team.players.map((p) => (
                      <ListItem
                        key={p.membershipId}
                        disableGutters
                        secondaryAction={
                          manager ? (
                            <MovePlayerMenu
                              gameId={gameId}
                              membershipId={p.membershipId}
                              name={p.name}
                              currentTeam={ti}
                              teamNames={teams.map((t) => t.name)}
                            />
                          ) : undefined
                        }
                      >
                        <ListItemText
                          primary={p.name}
                          secondary={
                            [
                              p.role ? POSITION_LABELS[p.role] : "Linha",
                              p.improvised ? "improvisado" : null,
                              manager ? `nota ${fmt(p.rating)}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
        {manager && (
          <ActionButton
            action={drawGameTeams.bind(null, gameId)}
            variant={draw ? "outlined" : "contained"}
            startIcon={<CasinoIcon />}
            disabled={!enough}
            confirm={
              draw
                ? {
                    title: "Sortear de novo?",
                    description: "Os times atuais e os ajustes manuais serão substituídos.",
                    confirmLabel: "Sortear de novo",
                  }
                : undefined
            }
          >
            {draw ? "Sortear de novo" : "Sortear times"}
          </ActionButton>
        )}
        {manager && draw && !published && (
          <ActionButton action={publishDraw.bind(null, gameId)} variant="contained">
            Publicar times
          </ActionButton>
        )}
        {draw && (published || manager) && (
          <>
            <WhatsAppButton text={share} label="Enviar times no WhatsApp" />
            <CopyButton text={share} label="Copiar times" successMessage="Times copiados!" />
          </>
        )}
      </Stack>
    </Stack>
  );
}
