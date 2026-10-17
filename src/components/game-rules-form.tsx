"use client";

import { useActionState } from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { ActionResult } from "@/lib/forms";
import { FormFeedback, SubmitButton } from "./feedback";

export function GameRulesForm({
  action,
  diaristaWindowHours,
  autoCreateGames,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  diaristaWindowHours: number | null;
  autoCreateGames: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const error = state.fieldErrors?.diaristaWindowHours;

  return (
    <Stack component="form" action={formAction} spacing={2} noValidate>
      <FormFeedback state={state} />
      <TextField
        name="diaristaWindowHours"
        type="number"
        label="Diaristas podem confirmar a partir de (horas antes do jogo)"
        defaultValue={state.values?.diaristaWindowHours ?? diaristaWindowHours ?? ""}
        error={Boolean(error)}
        helperText={
          error ??
          "Até esse momento, só mensalistas ocupam vagas; diaristas ficam na lista de espera. Deixe vazio para não ter prioridade."
        }
        slotProps={{ htmlInput: { min: 0, max: 168, inputMode: "numeric" } }}
      />
      <FormControlLabel
        control={<Checkbox name="autoCreateGames" defaultChecked={autoCreateGames} />}
        label="Criar o próximo jogo automaticamente (usa o dia e horário padrão da patota)"
      />
      <SubmitButton sx={{ alignSelf: "flex-start" }}>Salvar regras</SubmitButton>
    </Stack>
  );
}
