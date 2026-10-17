import type { Metadata } from "next";
import Stack from "@mui/material/Stack";
import { ActionButton } from "@/components/action-button";
import { AddGuestDialog } from "@/components/add-guest-dialog";
import { MembersList, type MemberRow } from "@/components/members-list";
import { PendingRequests } from "@/components/pending-requests";
import { memberImage, memberName, memberPositions } from "@/domain/members";
import { canManage, isOrganizer } from "@/domain/roles";
import { db } from "@/server/db";
import { requireMember } from "@/server/patotas";
import { leavePatota } from "../actions";

export const metadata: Metadata = { title: "Integrantes" };

const ROLE_ORDER = { ORGANIZER: 0, CO_ORGANIZER: 1, PLAYER: 2 } as const;

export default async function MembersPage({ params }: PageProps<"/patotas/[id]/membros">) {
  const { id } = await params;
  const { membership: me } = await requireMember(id);
  const manager = canManage(me.role);

  const all = await db.membership.findMany({
    where: { patotaId: id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  const memberships = all.filter((m) => m.status === "ACTIVE");
  const pending = manager ? all.filter((m) => m.status === "PENDING") : [];

  const rows: MemberRow[] = memberships
    .map((m) => ({
      id: m.id,
      name: memberName(m),
      image: memberImage(m),
      role: m.role,
      type: m.type,
      primaryPosition: memberPositions(m).primary,
      isMe: m.id === me.id,
      isGuest: !m.userId,
      // RF27: a nota não sai do servidor para quem não é organizador.
      rating: manager ? m.rating : undefined,
    }))
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name, "pt-BR"));

  return (
    <Stack spacing={3}>
      {pending.length > 0 && (
        <PendingRequests
          patotaId={id}
          requests={pending.map((m) => ({ id: m.id, name: memberName(m), email: m.user?.email ?? "", createdAt: m.createdAt }))}
        />
      )}
      {manager && (
        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
          <AddGuestDialog patotaId={id} />
        </Stack>
      )}
      <MembersList patotaId={id} members={rows} canManage={manager} isOrganizer={isOrganizer(me.role)} />
      <ActionButton
        action={leavePatota.bind(null, id)}
        color="error"
        sx={{ alignSelf: "flex-start" }}
        confirm={{
          title: "Sair da patota?",
          description: "Você deixa de ver os jogos e avisos. Para voltar, vai precisar de um novo convite.",
          confirmLabel: "Sair",
          destructive: true,
        }}
      >
        Sair da patota
      </ActionButton>
    </Stack>
  );
}
