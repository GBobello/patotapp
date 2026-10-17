import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { acceptInvite } from "@/app/(app)/patotas/actions";
import { auth } from "@/auth";
import { ActionButton } from "@/components/action-button";
import { LinkButton } from "@/components/links";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Convite" };

export default async function InvitePage({ params }: PageProps<"/convite/[codigo]">) {
  const code = (await params).codigo.toUpperCase();

  // Quem ainda não entrou faz login e volta direto para este convite.
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/convite/${code}`)}`);

  const patota = await db.patota.findUnique({
    where: { inviteCode: code },
    include: {
      _count: { select: { memberships: true } },
      memberships: { where: { userId: session.user.id }, select: { id: true } },
    },
  });

  return (
    <Container component="main" maxWidth="xs" sx={{ py: { xs: 4, sm: 8 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
        {patota ? (
          <Stack spacing={2} sx={{ textAlign: "center", alignItems: "center" }}>
            <GroupAddIcon aria-hidden sx={{ fontSize: 48, color: "primary.main" }} />
            <Typography variant="h5" component="h1">
              Convite para {patota.name}
            </Typography>
            {patota.location && <Typography color="text.secondary">{patota.location}</Typography>}
            <Typography>
              {patota._count.memberships} {patota._count.memberships === 1 ? "integrante" : "integrantes"}
            </Typography>
            {patota.memberships.length > 0 ? (
              <LinkButton href={`/patotas/${patota.id}`} variant="contained" size="large">
                Você já participa — abrir patota
              </LinkButton>
            ) : (
              <ActionButton action={acceptInvite.bind(null, code)} variant="contained" size="large">
                Entrar na patota
              </ActionButton>
            )}
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ textAlign: "center", alignItems: "center" }}>
            <Typography variant="h5" component="h1">
              Convite não encontrado
            </Typography>
            <Typography>O link pode estar errado ou foi substituído. Peça o link atualizado ao organizador.</Typography>
            <LinkButton href="/" variant="outlined">
              Ir para o início
            </LinkButton>
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
