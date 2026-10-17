"use client";

import { useActionState } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { loginWithEmail, type LoginState } from "./actions";

export function EmailLoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginWithEmail, {});

  return (
    <Stack component="form" action={formAction} spacing={2} noValidate>
      <TextField
        name="email"
        type="email"
        label="Seu e-mail"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.email}
        error={Boolean(state.error)}
        helperText={state.error ?? "Enviaremos um link para você entrar, sem precisar de senha."}
        slotProps={{ formHelperText: state.error ? { role: "alert" } : undefined }}
      />
      <Button type="submit" variant="contained" size="large" disabled={pending}>
        {pending ? "Enviando link…" : "Receber link de acesso"}
      </Button>
    </Stack>
  );
}
