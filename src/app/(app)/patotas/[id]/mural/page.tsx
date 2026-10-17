import type { Metadata } from "next";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CampaignIcon from "@mui/icons-material/Campaign";
import PushPinIcon from "@mui/icons-material/PushPin";
import { ActionButton } from "@/components/action-button";
import { ReactionBar } from "@/components/reaction-bar";
import { TextPostForm } from "@/components/text-post-form";
import { formatGameDate } from "@/domain/dates";
import { memberName } from "@/domain/members";
import { canManage } from "@/domain/roles";
import { db } from "@/server/db";
import { requireMember } from "@/server/patotas";
import { deleteAnnouncement, postAnnouncement, togglePin } from "./actions";

export const metadata: Metadata = { title: "Mural" };

export default async function MuralPage({ params }: PageProps<"/patotas/[id]/mural">) {
  const { id } = await params;
  const { membership: me } = await requireMember(id);
  const manager = canManage(me.role);

  const announcements = await db.announcement.findMany({
    where: { patotaId: id },
    include: { author: { include: { user: true } }, reactions: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return (
    <Stack spacing={3}>
      {manager && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
            Novo aviso
          </Typography>
          <TextPostForm
            action={postAnnouncement.bind(null, id)}
            label="Aviso para a patota"
            helper="Ex.: quadra mudou para a número 3"
            submitLabel="Publicar aviso"
            maxLength={1000}
          />
        </Paper>
      )}

      {announcements.length === 0 ? (
        <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", py: 4 }}>
          <CampaignIcon aria-hidden sx={{ fontSize: 48, color: "text.secondary" }} />
          <Typography>Nenhum aviso ainda.</Typography>
        </Stack>
      ) : (
        <Stack component="ul" spacing={2} sx={{ listStyle: "none", p: 0, m: 0 }}>
          {announcements.map((a) => {
            const counts: Record<string, { count: number; mine: boolean }> = {};
            for (const r of a.reactions) {
              counts[r.emoji] ??= { count: 0, mine: false };
              counts[r.emoji].count++;
              if (r.membershipId === me.id) counts[r.emoji].mine = true;
            }
            return (
              <li key={a.id}>
                <Card variant="outlined" component="article" aria-labelledby={`aviso-${a.id}`}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        <Typography id={`aviso-${a.id}`} variant="subtitle2" component="h3">
                          {a.author ? memberName(a.author) : "Organização"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatGameDate(a.createdAt)}
                        </Typography>
                        {a.pinned && <Chip size="small" icon={<PushPinIcon />} label="Fixado" color="primary" />}
                      </Stack>
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>{a.text}</Typography>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                        <ReactionBar announcementId={a.id} initial={counts} />
                        {manager && (
                          <Stack direction="row" spacing={0.5}>
                            <ActionButton action={togglePin.bind(null, a.id)} size="small">
                              {a.pinned ? "Desafixar" : "Fixar"}
                            </ActionButton>
                            <ActionButton
                              action={deleteAnnouncement.bind(null, a.id)}
                              size="small"
                              color="error"
                              confirm={{
                                title: "Excluir aviso?",
                                description: "O aviso sai do mural para todos.",
                                confirmLabel: "Excluir",
                                destructive: true,
                              }}
                            >
                              Excluir
                            </ActionButton>
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
