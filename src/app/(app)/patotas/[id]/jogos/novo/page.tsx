import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { GameForm } from "@/components/game-form";
import { WEEKDAYS, suggestGameDate, toLocalParts } from "@/domain/dates";
import { canManage } from "@/domain/roles";
import { requireMember } from "@/server/patotas";
import { createGame } from "../actions";

export const metadata: Metadata = { title: "Novo jogo" };

export default async function NewGamePage({ params }: PageProps<"/patotas/[id]/jogos/novo">) {
  const { id } = await params;
  const { patota, membership } = await requireMember(id);
  if (!canManage(membership.role)) notFound();

  // Sugere a próxima data do jogo recorrente; sem padrão, sugere daqui a 7 dias às 20h.
  const hasDefault = patota.defaultWeekday !== null && patota.defaultTime !== null;
  const parts = toLocalParts(suggestGameDate(patota.defaultWeekday, patota.defaultTime));

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h2">
        Novo jogo
      </Typography>
      {hasDefault && (
        <Typography color="text.secondary">
          Sugerimos a próxima {WEEKDAYS[patota.defaultWeekday!].toLowerCase()} às {patota.defaultTime}, o padrão
          desta patota.
        </Typography>
      )}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <GameForm
          action={createGame.bind(null, id)}
          defaults={{
            date: parts.date,
            time: patota.defaultTime ?? "20:00",
            location: patota.location ?? "",
            maxPlayers: patota.defaultMaxPlayers,
            teamsCount: patota.defaultTeamsCount,
            deadlineHours: patota.defaultDeadlineHours,
          }}
        />
      </Paper>
    </Stack>
  );
}
