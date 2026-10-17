import type { Metadata } from "next";
import { LinkButton } from "@/components/links";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import GroupsIcon from "@mui/icons-material/Groups";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Painel" };

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = (user.nickname ?? user.name ?? "").split(" ")[0];
  const profileIncomplete = !user.name || !user.primaryPosition;

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">
        {firstName ? `Olá, ${firstName}!` : "Olá!"}
      </Typography>

      {profileIncomplete && (
        <Alert
          severity="info"
          action={
            <LinkButton href="/perfil" color="inherit">
              Completar
            </LinkButton>
          }
        >
          Complete seu perfil com nome e posição para entrar no sorteio dos times.
        </Alert>
      )}

      {/* Estado vazio: patotas chegam no ciclo 2. */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center", py: 3 }}>
            <GroupsIcon aria-hidden sx={{ fontSize: 56, color: "text.secondary" }} />
            <Typography variant="h6" component="h2">
              Você ainda não está em nenhuma patota
            </Typography>
            <Typography color="text.secondary">
              Em breve você poderá criar uma patota ou entrar em uma pelo link de convite.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
