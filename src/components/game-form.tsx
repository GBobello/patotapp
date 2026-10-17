"use client";

import { useActionState } from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { ActionResult } from "@/lib/forms";
import { FormFeedback, SubmitButton } from "./feedback";

export type GameFormDefaults = {
  date: string;
  time: string;
  location: string;
  maxPlayers: number;
  teamsCount: number;
  deadlineHours: number;
};

export function GameForm({
  action,
  defaults,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaults: GameFormDefaults;
}) {
  const [state, formAction] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  const v = { ...Object.fromEntries(Object.entries(defaults).map(([k, x]) => [k, String(x)])), ...state.values };

  const field = (name: keyof GameFormDefaults) => ({
    name,
    defaultValue: v[name],
    error: Boolean(errors[name]),
  });

  return (
    <Stack component="form" action={formAction} spacing={2.5} noValidate>
      <FormFeedback state={state} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField {...field("date")} type="date" label="Data" required helperText={errors.date} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField {...field("time")} type="time" label="Horário" required helperText={errors.time} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={12}>
          <TextField {...field("location")} label="Local" helperText={errors.location} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            {...field("maxPlayers")}
            type="number"
            label="Vagas"
            required
            helperText={errors.maxPlayers ?? "Total de jogadores"}
            slotProps={{ htmlInput: { min: 2, max: 60, inputMode: "numeric" } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            {...field("teamsCount")}
            type="number"
            label="Times"
            required
            helperText={errors.teamsCount ?? "Usado no sorteio"}
            slotProps={{ htmlInput: { min: 2, max: 6, inputMode: "numeric" } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            {...field("deadlineHours")}
            type="number"
            label="Prazo (horas antes)"
            required
            helperText={errors.deadlineHours ?? "Quando a confirmação fecha"}
            slotProps={{ htmlInput: { min: 0, max: 72, inputMode: "numeric" } }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            name="notes"
            label="Observações (opcional)"
            multiline
            minRows={2}
            defaultValue={state.values?.notes}
            error={Boolean(errors.notes)}
            helperText={errors.notes ?? "Ex.: levar colete escuro"}
          />
        </Grid>
      </Grid>
      <FormControlLabel
        control={<Checkbox name="saveAsDefault" defaultChecked />}
        label="Repetir toda semana neste dia e horário (vira o padrão da patota)"
      />
      <SubmitButton size="large" pendingText="Criando…" sx={{ alignSelf: "flex-start" }}>
        Criar jogo
      </SubmitButton>
    </Stack>
  );
}
