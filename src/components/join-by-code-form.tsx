"use client";

import { useActionState } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { goToInvite } from "@/app/(app)/patotas/actions";
import { SubmitButton } from "./feedback";

export function JoinByCodeForm() {
  const [state, formAction] = useActionState(goToInvite, {});
  const error = state.fieldErrors?.code;

  return (
    <Stack component="form" action={formAction} direction={{ xs: "column", sm: "row" }} spacing={1.5} noValidate>
      <TextField
        name="code"
        label="Link ou código de convite"
        size="small"
        defaultValue={state.values?.code}
        error={Boolean(error)}
        helperText={error}
        slotProps={{ formHelperText: error ? { role: "alert" } : undefined }}
      />
      <SubmitButton variant="outlined" pendingText="Abrindo…" sx={{ flexShrink: 0 }}>
        Entrar
      </SubmitButton>
    </Stack>
  );
}
