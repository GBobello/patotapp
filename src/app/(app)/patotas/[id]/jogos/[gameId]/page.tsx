import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ActionButton } from "@/components/action-button";
import { AttendanceAdminMenu } from "@/components/attendance-admin-menu";
import { AttendanceButtons } from "@/components/attendance-buttons";
import { PlayerList, type PlayerItem } from "@/components/player-list";
import { CopyButton, WhatsAppButton } from "@/components/share-buttons";
import type { AttendanceStatus } from "@/domain/attendance";
import { formatGameDate, formatGameDateLong } from "@/domain/dates";
import { canManage } from "@/domain/roles";
import { gameListMessage } from "@/domain/share";
import { db } from "@/server/db";
import { requireGame } from "@/server/games";
import { displayName } from "@/server/patotas";
import { getOrigin } from "@/server/url";
import { cancelGame } from "../actions";

export async function generateMetadata({ params }: PageProps<"/patotas/[id]/jogos/[gameId]">): Promise<Metadata> {
  const { game } = await requireGame((await params).gameId);
  return { title: `Jogo de ${formatGameDate(game.startsAt)}` };
}

export default async function GamePage({ params }: PageProps<"/patotas/[id]/jogos/[gameId]">) {
  const { id, gameId } = await params;
  const { game, membership: me, patota } = await requireGame(gameId);
  if (game.patotaId !== id) notFound();
  const manager = canManage(me.role);

  const [attendances, members] = await Promise.all([
    db.attendance.findMany({
      where: { gameId },
      include: { membership: { include: { user: true } } },
      orderBy: { statusChangedAt: "asc" },
    }),
    db.membership.findMany({ where: { patotaId: id }, include: { user: true } }),
  ]);

  const byStatus = (s: AttendanceStatus) => attendances.filter((a) => a.status === s);
  const toItem = (m: (typeof members)[number], status: AttendanceStatus | null): PlayerItem => ({
    key: m.id,
    name: displayName(m.user),
    isMe: m.id === me.id,
    image: m.user.image,
    position: m.user.primaryPosition,
    detail: m.type === "DIARISTA" ? "Diarista" : undefined,
    action: manager ? (
      <AttendanceAdminMenu gameId={gameId} membershipId={m.id} name={displayName(m.user)} current={status} />
    ) : undefined,
  });
  const items = (s: AttendanceStatus) => byStatus(s).map((a) => toItem(a.membership, a.status));

  const responded = new Set(attendances.map((a) => a.membershipId));
  const noAnswer = members
    .filter((m) => !responded.has(m.id))
    .sort((a, b) => displayName(a.user).localeCompare(displayName(b.user), "pt-BR"))
    .map((m) => toItem(m, null));

  const myStatus = attendances.find((a) => a.membershipId === me.id)?.status ?? null;
  const cancelled = game.status === "CANCELLED";
  const closed = game.confirmationDeadline <= new Date();
  const confirmed = items("CONFIRMED");

  const shareText = gameListMessage({
    patotaName: patota.name,
    startsAt: game.startsAt,
    location: game.location,
    maxPlayers: game.maxPlayers,
    confirmed: confirmed.map((p) => p.name),
    waitlist: items("WAITLIST").map((p) => p.name),
    maybe: items("MAYBE").map((p) => p.name),
    link: `${await getOrigin()}/patotas/${id}/jogos/${gameId}`,
  });

  return (
    <Stack spacing={2.5}>
      <div>
        <Typography variant="h5" component="h2">
          <span aria-hidden>Jogo de {formatGameDate(game.startsAt)}</span>
          <span className="visually-hidden">Jogo de {formatGameDateLong(game.startsAt)}</span>
        </Typography>
        {game.location && <Typography color="text.secondary">{game.location}</Typography>}
        <Typography color="text.secondary" variant="body2">
          {game.teamsCount} times · confirmações até {formatGameDate(game.confirmationDeadline)}
        </Typography>
      </div>

      {cancelled && <Alert severity="error">Este jogo foi cancelado.</Alert>}
      {game.notes && <Alert severity="info">{game.notes}</Alert>}

      {!cancelled && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
              Sua presença
            </Typography>
            {closed && !manager && (
              <Typography variant="body2" color="text.secondary">
                As confirmações estão encerradas. Fale com o organizador se precisar mudar.
              </Typography>
            )}
            <AttendanceButtons
              gameId={gameId}
              current={myStatus}
              disabled={closed && !manager}
              gameLabel={formatGameDate(game.startsAt)}
            />
          </Stack>
        </Paper>
      )}

      <PlayerList
        headingId="confirmados"
        title="Confirmados"
        countLabel={`${confirmed.length} de ${game.maxPlayers}`}
        items={confirmed}
        numbered
        emptyText="Ninguém confirmou ainda."
      />
      <PlayerList headingId="espera" title="Lista de espera" items={items("WAITLIST")} numbered />
      <PlayerList headingId="talvez" title="Talvez" items={items("MAYBE")} />
      <PlayerList headingId="nao-vao" title="Não vão" items={items("DECLINED")} />
      <PlayerList headingId="sem-resposta" title="Ainda não responderam" items={noAnswer} />

      {!cancelled && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <WhatsAppButton text={shareText} label="Enviar lista no WhatsApp" />
          <CopyButton text={shareText} label="Copiar lista" successMessage="Lista copiada!" />
          {manager && (
            <ActionButton
              action={cancelGame.bind(null, gameId)}
              color="error"
              confirm={{
                title: "Cancelar este jogo?",
                description: "Todos verão o jogo como cancelado e as confirmações serão encerradas.",
                confirmLabel: "Cancelar jogo",
                destructive: true,
              }}
            >
              Cancelar jogo
            </ActionButton>
          )}
        </Stack>
      )}
    </Stack>
  );
}
