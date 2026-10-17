import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { GameForm } from "@/components/game-form";
import { formatGameDate, toLocalParts } from "@/domain/dates";
import { deadlineHoursOf } from "@/domain/games";
import { canManage } from "@/domain/roles";
import { requireGame } from "@/server/games";
import { updateGame } from "../../actions";

export const metadata: Metadata = { title: "Editar jogo" };

export default async function EditGamePage({ params }: PageProps<"/patotas/[id]/jogos/[gameId]/editar">) {
  const { id, gameId } = await params;
  const { game, membership } = await requireGame(gameId);
  if (game.patotaId !== id || !canManage(membership.role) || game.status === "CANCELLED") notFound();
  const local = toLocalParts(game.startsAt);

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h2">
        Editar jogo de {formatGameDate(game.startsAt)}
      </Typography>
      <Alert severity="info">
        Se diminuir as vagas, quem confirmou por último volta para a lista de espera. Se aumentar, a lista de espera
        é promovida automaticamente. Mudar o número de times apaga o sorteio.
      </Alert>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <GameForm
          mode="edit"
          action={updateGame.bind(null, gameId)}
          defaults={{
            date: local.date,
            time: local.time,
            location: game.location ?? "",
            maxPlayers: game.maxPlayers,
            teamsCount: game.teamsCount,
            deadlineHours: deadlineHoursOf(game.startsAt, game.confirmationDeadline),
            notes: game.notes ?? "",
          }}
        />
      </Paper>
    </Stack>
  );
}
