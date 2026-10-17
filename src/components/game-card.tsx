import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EventIcon from "@mui/icons-material/Event";
import PlaceIcon from "@mui/icons-material/Place";
import type { AttendanceStatus } from "@/domain/attendance";
import { formatGameDate, formatGameDateLong, relativeDay } from "@/domain/dates";
import { AttendanceButtons } from "./attendance-buttons";
import { LinkButton } from "./links";

export type GameSummary = {
  id: string;
  patotaId: string;
  patotaName?: string;
  startsAt: Date;
  location: string | null;
  maxPlayers: number;
  status: "SCHEDULED" | "CANCELLED";
  confirmationDeadline: Date;
  confirmedCount: number;
  waitlistCount: number;
  myStatus: AttendanceStatus | null;
  myWaitlistPosition: number | null;
};

function myStatusText(g: GameSummary) {
  switch (g.myStatus) {
    case "CONFIRMED":
      return "Você está confirmado";
    case "WAITLIST":
      return `Você está na lista de espera (${g.myWaitlistPosition}º)`;
    case "MAYBE":
      return "Você marcou talvez";
    case "DECLINED":
      return "Você não vai";
    default:
      return "Você ainda não respondeu";
  }
}

/** Cartão de jogo com confirmação direta — a tarefa principal em até 2 toques (RNF13). */
export function GameCard({ game, headingLevel = "h3" }: { game: GameSummary; headingLevel?: "h2" | "h3" }) {
  const cancelled = game.status === "CANCELLED";
  const closed = game.confirmationDeadline <= new Date();
  const fill = Math.min(100, Math.round((game.confirmedCount / game.maxPlayers) * 100));
  const label = formatGameDate(game.startsAt);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
            <Box>
              {game.patotaName && (
                <Typography variant="overline" color="text.secondary" component="p">
                  {game.patotaName}
                </Typography>
              )}
              <Typography variant="h6" component={headingLevel} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EventIcon aria-hidden color="primary" />
                <span>
                  <span aria-hidden>{label}</span>
                  <span className="visually-hidden">{formatGameDateLong(game.startsAt)}</span>
                </span>
              </Typography>
              {game.location && (
                <Typography color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <PlaceIcon fontSize="small" aria-hidden /> {game.location}
                </Typography>
              )}
            </Box>
            <Chip
              size="small"
              label={cancelled ? "Cancelado" : relativeDay(game.startsAt)}
              color={cancelled ? "error" : "default"}
            />
          </Stack>

          {!cancelled && (
            <>
              <Box>
                <Typography variant="body2" id={`vagas-${game.id}`}>
                  <strong>{game.confirmedCount}</strong> de {game.maxPlayers} confirmados
                  {game.waitlistCount > 0 && ` · ${game.waitlistCount} na espera`}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={fill}
                  aria-labelledby={`vagas-${game.id}`}
                  sx={{ mt: 0.5, height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {myStatusText(game)}
                {closed && " · confirmações encerradas"}
              </Typography>
              <AttendanceButtons gameId={game.id} current={game.myStatus} disabled={closed} gameLabel={label} />
            </>
          )}

          <LinkButton href={`/patotas/${game.patotaId}/jogos/${game.id}`} sx={{ alignSelf: "flex-start" }}>
            Ver lista e detalhes
          </LinkButton>
        </Stack>
      </CardContent>
    </Card>
  );
}
