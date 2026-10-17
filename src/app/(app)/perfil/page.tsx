import type { Metadata } from "next";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { cookies } from "next/headers";
import { AccessibilityPreferences } from "@/components/accessibility-preferences";
import { ActionButton } from "@/components/action-button";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { logoutEverywhere } from "../actions";
import { readPreferences } from "@/lib/preferences";
import { requireUser } from "@/server/session";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
  const user = await requireUser();
  const jar = await cookies();
  const prefs = readPreferences((name) => jar.get(name)?.value);

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4" component="h1">
          Meu perfil
        </Typography>
        <Typography color="text.secondary">Conectado como {user.email}</Typography>
      </div>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <ProfileForm
          initial={{
            name: user.name ?? "",
            nickname: user.nickname ?? "",
            phone: user.phone ?? "",
            primaryPosition: user.primaryPosition ?? "",
            secondaryPositions: user.secondaryPositions,
          }}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }} component="section" aria-labelledby="acessibilidade">
        <Typography id="acessibilidade" variant="h6" component="h2" gutterBottom>
          Acessibilidade e aparência
        </Typography>
        <AccessibilityPreferences initial={prefs} />
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }} component="section" aria-labelledby="sessoes">
        <Typography id="sessoes" variant="h6" component="h2" gutterBottom>
          Sessões
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 1.5 }}>
          Você fica conectado por 30 dias em cada aparelho. Perdeu o celular? Saia de todos de uma vez.
        </Typography>
        <ActionButton
          action={logoutEverywhere}
          variant="outlined"
          confirm={{
            title: "Sair de todos os aparelhos?",
            description: "Você vai precisar entrar de novo em cada aparelho, inclusive neste.",
            confirmLabel: "Sair de todos",
          }}
        >
          Sair de todos os aparelhos
        </ActionButton>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderColor: "error.main" }} component="section" aria-labelledby="excluir-conta">
        <Typography id="excluir-conta" variant="h6" component="h2" color="error" gutterBottom>
          Excluir conta
        </Typography>
        <DeleteAccountForm />
      </Paper>
    </Stack>
  );
}
