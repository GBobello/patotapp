"use client";

import { useActionState, useState } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { ActionResult } from "@/lib/forms";
import { SubmitButton, useNotify } from "./feedback";

/** Formulário de texto curto: aviso do mural (RF46) ou comentário do jogo (RF47). */
export function TextPostForm({
  action,
  label,
  helper,
  submitLabel,
  maxLength,
  minRows = 2,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  label: string;
  helper?: string;
  submitLabel: string;
  maxLength: number;
  minRows?: number;
}) {
  const notify = useNotify();
  const [text, setText] = useState("");
  const [state, formAction] = useActionState(async (prev: ActionResult, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.ok) {
      setText("");
      notify(result);
    }
    return result;
  }, {});
  const error = state.ok ? undefined : state.fieldErrors?.text;

  return (
    <Stack component="form" action={formAction} spacing={1.5} noValidate>
      <TextField
        name="text"
        label={label}
        multiline
        minRows={minRows}
        value={text}
        onChange={(e) => setText(e.target.value)}
        error={Boolean(error)}
        helperText={error ?? `${helper ? `${helper} · ` : ""}${text.length}/${maxLength}`}
        slotProps={{ htmlInput: { maxLength } }}
      />
      <SubmitButton pendingText="Enviando…" sx={{ alignSelf: "flex-start" }}>
        {submitLabel}
      </SubmitButton>
    </Stack>
  );
}
