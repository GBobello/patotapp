import type { Metadata } from "next";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PatotaForm } from "@/components/patota-form";
import { requireUser } from "@/server/session";
import { createPatota } from "../actions";

export const metadata: Metadata = { title: "Nova patota" };

export default async function NewPatotaPage() {
  await requireUser();

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4" component="h1">
          Nova patota
        </Typography>
        <Typography color="text.secondary">Você será o organizador e poderá convidar a galera depois.</Typography>
      </div>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <PatotaForm action={createPatota} submitLabel="Criar patota" />
      </Paper>
    </Stack>
  );
}
