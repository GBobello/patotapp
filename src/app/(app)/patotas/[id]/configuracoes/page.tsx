import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DeletePatotaForm } from "@/components/delete-patota-form";
import { GameRulesForm } from "@/components/game-rules-form";
import { InviteCard } from "@/components/invite-card";
import { PatotaForm } from "@/components/patota-form";
import { canManage, isOrganizer } from "@/domain/roles";
import { requireMember } from "@/server/patotas";
import { deletePatota, updateGameRules, updatePatota } from "../actions";

export const metadata: Metadata = { title: "Ajustes da patota" };

export default async function PatotaSettingsPage({ params }: PageProps<"/patotas/[id]/configuracoes">) {
  const { id } = await params;
  const { patota, membership } = await requireMember(id);
  if (!canManage(membership.role)) notFound();

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Dados da patota
        </Typography>
        <PatotaForm
          action={updatePatota.bind(null, id)}
          submitLabel="Salvar"
          initial={{ name: patota.name, description: patota.description ?? "", location: patota.location ?? "" }}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Regras dos jogos
        </Typography>
        <GameRulesForm action={updateGameRules.bind(null, id)} diaristaWindowHours={patota.diaristaWindowHours} />
      </Paper>

      <InviteCard patota={patota} />

      {isOrganizer(membership.role) && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderColor: "error.main" }}>
          <Typography variant="h6" component="h2" color="error" gutterBottom>
            Excluir patota
          </Typography>
          <DeletePatotaForm name={patota.name} action={deletePatota.bind(null, id)} />
        </Paper>
      )}
    </Stack>
  );
}
