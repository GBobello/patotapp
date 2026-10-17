import type { Metadata } from "next";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { requireUser } from "@/server/session";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
  const user = await requireUser();

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
    </Stack>
  );
}
