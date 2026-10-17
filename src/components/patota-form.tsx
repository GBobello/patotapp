"use client";

import { useActionState } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { ActionResult } from "@/lib/forms";
import { FormFeedback, SubmitButton } from "./feedback";

type Values = { name: string; description: string; location: string };

/** Formulário de criar/editar patota. */
export function PatotaForm({
  action,
  initial = { name: "", description: "", location: "" },
  submitLabel,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  initial?: Values;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  const values = { ...initial, ...state.values };

  return (
    <Stack component="form" action={formAction} spacing={2.5} noValidate>
      <FormFeedback state={state} />
      <TextField
        name="name"
        label="Nome da patota"
        required
        defaultValue={values.name}
        error={Boolean(errors.name)}
        helperText={errors.name ?? "Ex.: Futebol de Quinta"}
      />
      <TextField
        name="location"
        label="Local (opcional)"
        defaultValue={values.location}
        error={Boolean(errors.location)}
        helperText={errors.location ?? "Ex.: Arena Society Centro, quadra 2"}
      />
      <TextField
        name="description"
        label="Descrição (opcional)"
        multiline
        minRows={2}
        defaultValue={values.description}
        error={Boolean(errors.description)}
        helperText={errors.description}
      />
      <SubmitButton size="large" sx={{ alignSelf: "flex-start" }}>
        {submitLabel}
      </SubmitButton>
    </Stack>
  );
}
