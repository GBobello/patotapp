"use client";

import { useActionState } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { deleteAccount } from "@/app/(app)/perfil/actions";
import { FormFeedback, SubmitButton } from "./feedback";

export function DeleteAccountForm() {
  const [state, formAction] = useActionState(deleteAccount, {});
  const error = state.fieldErrors?.confirm;

  return (
    <Stack component="form" action={formAction} spacing={2} noValidate>
      <FormFeedback state={state} />
      <Typography>
        Apaga seu perfil, suas presenças e cobranças em todas as patotas. <strong>Não dá para desfazer.</strong>
      </Typography>
      <TextField name="confirm" label="Digite EXCLUIR para confirmar" autoComplete="off" error={Boolean(error)} helperText={error} />
      <SubmitButton color="error" pendingText="Excluindo…" sx={{ alignSelf: "flex-start" }}>
        Excluir minha conta
      </SubmitButton>
    </Stack>
  );
}
