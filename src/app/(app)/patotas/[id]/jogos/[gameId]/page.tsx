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
import { GameComments } from "@/components/game-comments";
import { GameResultForm } from "@/components/game-result-form";
import { LinkButton } from "@/components/links";
import { CopyButton, WhatsAppButton } from "@/components/share-buttons";
import { TeamsSection, type TeamMemberInfo } from "@/components/teams-section";
import type { AttendanceStatus } from "@/domain/attendance";
import { formatGameDate, formatGameDateLong } from "@/domain/dates";
import { canManage } from "@/domain/roles";
import { memberImage, memberName, memberPositions } from "@/domain/members";
import { gameListMessage } from "@/domain/share";
import { parseStoredDraw, teamName } from "@/domain/teams";
import { db } from "@/server/db";
import { requireGame, syncGameSpots } from "@/server/games";
import { getOrigin } from "@/server/url";
import { generateGameCharges } from "../../financeiro/actions";
import { cancelGame, saveGameResult } from "../actions";

export async function generateMetadata({ params }: PageProps<"/patotas/[id]/jogos/[gameId]">): Promise<Metadata> {
  const { game } = await requireGame((await params).gameId);
  return { title: `Jogo de ${formatGameDate(game.startsAt)}` };
}

export default async function GamePage({ params, searchParams }: PageProps<"/patotas/[id]/jogos/[gameId]">) {
  const { id, gameId } = await params;
  const { editado } = await searchParams;
  const { game, membership: me, patota } = await requireGame(gameId);
  if (game.patotaId !== id) notFound();
  const manager = canManage(me.role);
  const diaristaWindowOpen = !game.diaristasOpenAt || game.diaristasOpenAt <= new Date();
  if (game.status === "SCHEDULED" && game.diaristasOpenAt) await syncGameSpots(gameId);

  const [attendances, members, comments] = await Promise.all([
    db.attendance.findMany({
      where: { gameId },
      include: { membership: { include: { user: true } } },
      orderBy: { statusChangedAt: "asc" },
    }),
    db.membership.findMany({ where: { patotaId: id, status: "ACTIVE" }, include: { user: true } }),
    db.gameComment.findMany({
      where: { gameId },
      include: { author: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const byStatus = (s: AttendanceStatus) => attendances.filter((a) => a.status === s);
  const toItem = (m: (typeof members)[number], status: AttendanceStatus | null): PlayerItem => ({
    key: m.id,
    name: memberName(m),
    isMe: m.id === me.id,
    image: memberImage(m),
    position: memberPositions(m).primary,
    detail: [m.user ? null : "Convidado", m.type === "DIARISTA" ? "Diarista" : null].filter(Boolean).join(" · ") || undefined,
    action: manager ? (
      <AttendanceAdminMenu gameId={gameId} membershipId={m.id} name={memberName(m)} current={status} />
    ) : undefined,
  });
  const items = (s: AttendanceStatus) => byStatus(s).map((a) => toItem(a.membership, a.status));

  const responded = new Set(attendances.map((a) => a.membershipId));
  const noAnswer = members
    .filter((m) => !responded.has(m.id))
    .sort((a, b) => memberName(a).localeCompare(memberName(b), "pt-BR"))
    .map((m) => toItem(m, null));

  const myStatus = attendances.find((a) => a.membershipId === me.id)?.status ?? null;
  const cancelled = game.status === "CANCELLED";
  const started = game.startsAt <= new Date();
  const scorers = attendances.filter((a) => a.attended && a.goals > 0).sort((a, b) => b.goals - a.goals);
  const closed = game.confirmationDeadline <= new Date();
  const confirmed = items("CONFIRMED");
  const teamMembers = new Map<string, TeamMemberInfo>(
    members.map((m) => [m.id, { name: memberName(m), rating: m.rating, primary: memberPositions(m).primary }]),
  );

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

      {typeof editado === "string" && (
        <Alert severity="success" role="status">
          Jogo atualizado.
          {Number(editado) > 0 && ` Como as vagas diminuíram, ${editado} ${Number(editado) === 1 ? "pessoa voltou" : "pessoas voltaram"} para a lista de espera.`}
        </Alert>
      )}
      {cancelled && <Alert severity="error">Este jogo foi cancelado.</Alert>}
      {game.notes && <Alert severity="info">{game.notes}</Alert>}
      {!cancelled && !diaristaWindowOpen && (
        <Alert severity="info">
          Mensalistas têm prioridade. Vagas para diaristas abrem {formatGameDate(game.diaristasOpenAt!)}.
        </Alert>
      )}

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

      {!cancelled && (
        <TeamsSection
          gameId={gameId}
          title={`${patota.name} — ${formatGameDate(game.startsAt)}`}
          draw={parseStoredDraw(game.draw)}
          published={Boolean(game.drawPublishedAt)}
          manager={manager}
          teamsCount={game.teamsCount}
          confirmedIds={byStatus("CONFIRMED").map((a) => a.membershipId)}
          members={teamMembers}
          teamNames={patota.teamNames}
        />
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
            <LinkButton href={`/patotas/${id}/jogos/${gameId}/editar`} variant="outlined">
              Editar jogo
            </LinkButton>
          )}
          {manager && (
            <ActionButton action={generateGameCharges.bind(null, gameId)}>Gerar cobranças do jogo</ActionButton>
          )}
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

      {game.resultSavedAt && (
        <Paper variant="outlined" sx={{ p: 2 }} component="section" aria-labelledby="resultado">
          <Typography id="resultado" variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
            Resultado
          </Typography>
          {game.teamScores.length > 0 && (
            <Typography variant="h5" component="p" sx={{ my: 1 }}>
              {game.teamScores.map((s, i) => `${teamName(i, patota.teamNames)} ${s}`).join(" × ")}
            </Typography>
          )}
          <Typography color="text.secondary">
            {attendances.filter((a) => a.attended).length} jogadores compareceram
            {scorers.length > 0 && ` · Gols: ${scorers.map((a) => `${memberName(a.membership)} (${a.goals})`).join(", ")}`}
          </Typography>
        </Paper>
      )}

      {manager && !cancelled && started && (
        <Paper variant="outlined" sx={{ p: 2 }} component="section" aria-labelledby="registrar-resultado">
          <Typography id="registrar-resultado" variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
            {game.resultSavedAt ? "Corrigir resultado" : "Registrar resultado do jogo"}
          </Typography>
          <GameResultForm
            action={saveGameResult.bind(null, gameId)}
            teamNames={(parseStoredDraw(game.draw)?.teams ?? []).map((_, i) => teamName(i, patota.teamNames))}
            scores={game.teamScores}
            players={attendances
              .filter((a) => a.status !== "DECLINED")
              .map((a) => ({
                membershipId: a.membershipId,
                name: memberName(a.membership),
                attended: a.attended ?? a.status === "CONFIRMED",
                goals: a.goals,
              }))}
          />
        </Paper>
      )}

      <GameComments
        gameId={gameId}
        comments={comments.map((c) => ({
          id: c.id,
          author: c.author ? memberName(c.author) : "Ex-integrante",
          text: c.text,
          createdAt: c.createdAt,
          canDelete: manager || c.authorId === me.id,
        }))}
      />
    </Stack>
  );
}
