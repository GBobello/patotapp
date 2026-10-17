import type { Metadata } from "next";
import Stack from "@mui/material/Stack";
import { ActionButton } from "@/components/action-button";
import { MembersList, type MemberRow } from "@/components/members-list";
import { canManage, isOrganizer } from "@/domain/roles";
import { db } from "@/server/db";
import { displayName, requireMember } from "@/server/patotas";
import { leavePatota } from "../actions";

export const metadata: Metadata = { title: "Integrantes" };

const ROLE_ORDER = { ORGANIZER: 0, CO_ORGANIZER: 1, PLAYER: 2 } as const;

export default async function MembersPage({ params }: PageProps<"/patotas/[id]/membros">) {
  const { id } = await params;
  const { membership: me } = await requireMember(id);

  const memberships = await db.membership.findMany({
    where: { patotaId: id },
    include: { user: true },
  });

  const rows: MemberRow[] = memberships
    .map((m) => ({
      id: m.id,
      name: displayName(m.user),
      image: m.user.image,
      role: m.role,
      type: m.type,
      primaryPosition: m.user.primaryPosition,
      isMe: m.id === me.id,
    }))
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name, "pt-BR"));

  return (
    <Stack spacing={3}>
      <MembersList
        patotaId={id}
        members={rows}
        canManage={canManage(me.role)}
        isOrganizer={isOrganizer(me.role)}
      />
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
