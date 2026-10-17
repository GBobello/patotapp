"use client";

import { useActionState, useState } from "react";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { addExpense, generateMonthlyCharges } from "@/app/(app)/patotas/[id]/financeiro/actions";
import { competenceLabel } from "@/domain/billing";
import type { ActionResult } from "@/lib/forms";
import { ActionButton } from "./action-button";
import { FormFeedback, SubmitButton } from "./feedback";

/** RF39: escolhe o mês e gera as mensalidades. */
export function MonthlyChargesControl({ patotaId, months }: { patotaId: string; months: string[] }) {
  const [competence, setCompetence] = useState(months[1] ?? months[0]);

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
      <TextField
        select
        size="small"
        label="Mês"
        value={competence}
        onChange={(e) => setCompetence(e.target.value)}
        sx={{ minWidth: 200 }}
        fullWidth={false}
      >
        {months.map((m) => (
          <MenuItem key={m} value={m}>
            {competenceLabel(m)}
          </MenuItem>
        ))}
      </TextField>
      <ActionButton
        action={() => generateMonthlyCharges(patotaId, competence)}
        variant="contained"
        startIcon={<ReceiptLongIcon />}
      >
        Gerar mensalidades
      </ActionButton>
    </Stack>
  );
}

/** RF38: registrar despesa. */
export function ExpenseForm({ patotaId, today }: { patotaId: string; today: string }) {
  const [state, formAction] = useActionState(
    (prev: ActionResult, formData: FormData) => addExpense(patotaId, prev, formData),
    {},
  );
  const errors = state.ok ? {} : (state.fieldErrors ?? {});
  const v = state.ok ? undefined : state.values;

  return (
    <Stack component="form" action={formAction} spacing={2} noValidate>
      <FormFeedback state={state} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            name="description"
            label="Descrição"
            defaultValue={v?.description}
            error={Boolean(errors.description)}
            helperText={errors.description ?? "Ex.: aluguel da quadra"}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="amountCents"
            label="Valor"
            inputMode="decimal"
            defaultValue={v?.amountCents}
            error={Boolean(errors.amountCents)}
            helperText={errors.amountCents}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            name="date"
            type="date"
            label="Data"
            defaultValue={v?.date ?? today}
            error={Boolean(errors.date)}
            helperText={errors.date}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
      </Grid>
      <SubmitButton variant="outlined" pendingText="Registrando…" sx={{ alignSelf: "flex-start" }}>
        Registrar despesa
      </SubmitButton>
    </Stack>
  );
}
