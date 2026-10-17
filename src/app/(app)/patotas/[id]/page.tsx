import type { Metadata } from "next";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { InviteCard } from "@/components/invite-card";
import { canManage } from "@/domain/roles";
import { requireMember } from "@/server/patotas";

export async function generateMetadata({ params }: PageProps<"/patotas/[id]">): Promise<Metadata> {
  const { patota } = await requireMember((await params).id);
  return { title: patota.name };
}

export default async function PatotaHomePage({ params }: PageProps<"/patotas/[id]">) {
  const { id } = await params;
  const { patota, membership } = await requireMember(id);

  return (
    <Stack spacing={3}>
      {patota.description && <Typography>{patota.description}</Typography>}
      {canManage(membership.role) && <InviteCard patota={patota} />}
    </Stack>
  );
}
