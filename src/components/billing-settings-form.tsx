"use client";

import { useActionState, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  BILLING_MODES,
  BILLING_MODE_LABELS,
  type BillingMode,
  centsToInput,
  formatMoney,
  parseMoney,
  suggestedMonthlyFee,
} from "@/domain/billing";
import type { ActionResult } from "@/lib/forms";
import { FormFeedback, SubmitButton } from "./feedback";

export type BillingSettings = {
  billingMode: BillingMode;
  monthlyFeeCents: number;
  dropInFeeCents: number;
  gameCostCents: number;
  monthlyCostCents: number;
  pixKey: string | null;
  keeperExempt: boolean;
};

function MoneyField(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      inputMode="decimal"
      slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
    />
  );
}

/** RF37, RF40, RF42, RF44: como a patota cobra. */
export function BillingSettingsForm({
  action,
  initial,
  mensalistas,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  initial: BillingSettings;
  mensalistas: number;
}) {
  const [state, formAction] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  const v = state.values;
  const [mode, setMode] = useState<BillingMode>((v?.billingMode as BillingMode) ?? initial.billingMode);
  const [monthlyCost, setMonthlyCost] = useState(v?.monthlyCostCents ?? centsToInput(initial.monthlyCostCents));
  const suggestion = suggestedMonthlyFee(parseMoney(monthlyCost) ?? 0, mensalistas);

  const money = (name: keyof BillingSettings, label: string, helper?: string) => (
    <MoneyField
      name={name}
      label={label}
      defaultValue={v?.[name] ?? centsToInput(initial[name] as number)}
      error={Boolean(errors[name])}
      helperText={errors[name] ?? helper}
    />
  );

  return (
    <Stack component="form" action={formAction} spacing={2.5} noValidate>
      <FormFeedback state={state} />

      <FormControl component="fieldset">
        <FormLabel component="legend">Modelo de cobrança</FormLabel>
        <RadioGroup name="billingMode" value={mode} onChange={(e) => setMode(e.target.value as BillingMode)}>
          {BILLING_MODES.map((m) => (
            <FormControlLabel
              key={m}
              value={m}
              control={<Radio />}
              label={
                <span>
                  <strong>{BILLING_MODE_LABELS[m].title}</strong>
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ display: "block" }}>
                    {BILLING_MODE_LABELS[m].description}
                  </Typography>
                </span>
              }
              sx={{ alignItems: "flex-start", mb: 1, "& .MuiRadio-root": { mt: -0.5 } }}
            />
          ))}
        </RadioGroup>
      </FormControl>

      <Grid container spacing={2}>
        {mode === "FIXED_MONTHLY" ? (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <MoneyField
                name="monthlyCostCents"
                label="Custo fixo mensal (aluguel etc.)"
                value={monthlyCost}
                onChange={(e) => setMonthlyCost(e.target.value)}
                error={Boolean(errors.monthlyCostCents)}
                helperText={
                  errors.monthlyCostCents ??
                  (suggestion
                    ? `Sugestão de mensalidade para ${mensalistas} mensalistas: ${formatMoney(suggestion)}`
                    : "Usado para sugerir a mensalidade.")
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{money("monthlyFeeCents", "Mensalidade")}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{money("dropInFeeCents", "Valor por jogo do diarista")}</Grid>
            <input type="hidden" name="gameCostCents" value={centsToInput(initial.gameCostCents)} />
          </>
        ) : (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              {money("gameCostCents", "Custo de cada jogo", "Dividido igualmente entre os confirmados.")}
            </Grid>
            <input type="hidden" name="monthlyFeeCents" value={centsToInput(initial.monthlyFeeCents)} />
            <input type="hidden" name="dropInFeeCents" value={centsToInput(initial.dropInFeeCents)} />
            <input type="hidden" name="monthlyCostCents" value={monthlyCost} />
          </>
        )}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="pixKey"
            label="Chave PIX da patota (opcional)"
            defaultValue={v?.pixKey ?? initial.pixKey ?? ""}
            error={Boolean(errors.pixKey)}
            helperText={errors.pixKey ?? "Aparece para todos com botão de copiar."}
          />
        </Grid>
      </Grid>

      <FormControlLabel
        control={<Checkbox name="keeperExempt" defaultChecked={initial.keeperExempt} />}
        label="Goleiros não pagam"
      />

      <SubmitButton sx={{ alignSelf: "flex-start" }}>Salvar cobrança</SubmitButton>
    </Stack>
  );
}
