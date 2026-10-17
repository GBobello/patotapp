"use client";

import { useActionState } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ActionResult } from "@/lib/forms";
import { FormFeedback, SubmitButton } from "./feedback";

/** Exclusão exige digitar o nome da patota (Heurística 5: prevenção de erros). */
export function DeletePatotaForm({
  name,
  action,
}: {
  name: string;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useActionState(action, {});
  const error = state.fieldErrors?.confirmName;

  return (
    <Stack component="form" action={formAction} spacing={2} noValidate>
      <FormFeedback state={state} />
      <Typography>
        Isso apaga a patota e todo o histórico de jogos e pagamentos. <strong>Não dá para desfazer.</strong>
      </Typography>
      <TextField
        name="confirmName"
        label={`Digite "${name}" para confirmar`}
        autoComplete="off"
        error={Boolean(error)}
        helperText={error}
      />
      <SubmitButton color="error" pendingText="Excluindo…" sx={{ alignSelf: "flex-start" }}>
        Excluir patota
      </SubmitButton>
    </Stack>
  );
}
