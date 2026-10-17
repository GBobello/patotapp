"use client";

import { useActionState, useState } from "react";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import { addDrawRule, deleteDrawRule, updateTeamNames } from "@/app/(app)/patotas/[id]/actions";
import { MAX_TEAM_NAMES, TEAM_NAMES } from "@/domain/teams";
import type { ActionResult } from "@/lib/forms";
import { useServerAction } from "./action-button";
import { FormFeedback, SubmitButton, useNotify } from "./feedback";

/** RF36: nome/colete de cada time. */
export function TeamNamesForm({ patotaId, initial }: { patotaId: string; initial: string[] }) {
  const [state, formAction] = useActionState(
    (prev: ActionResult, fd: FormData) => updateTeamNames(patotaId, prev, fd),
    {},
  );
  const errors = state.fieldErrors ?? {};

  return (
    <Stack component="form" action={formAction} spacing={2} noValidate>
      <FormFeedback state={state} />
      <Typography variant="body2" color="text.secondary">
        Use a cor do colete para todo mundo saber de que lado está. Deixe vazio para usar &quot;Time A&quot;, &quot;Time B&quot;…
      </Typography>
      <Grid container spacing={2}>
        {Array.from({ length: MAX_TEAM_NAMES }, (_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              name={`team:${i}`}
              label={`${TEAM_NAMES[i]} (opcional)`}
              placeholder={i === 0 ? "Ex.: Colete laranja" : i === 1 ? "Ex.: Sem colete" : ""}
              defaultValue={state.values?.[`team:${i}`] ?? initial[i] ?? ""}
              error={Boolean(errors[`team:${i}`])}
              helperText={errors[`team:${i}`]}
              slotProps={{ htmlInput: { maxLength: 30 } }}
            />
          </Grid>
        ))}
      </Grid>
      <SubmitButton sx={{ alignSelf: "flex-start" }}>Salvar nomes</SubmitButton>
    </Stack>
  );
}

export type RuleRow = { id: string; kind: "TOGETHER" | "APART"; first: string; second: string };

/** RF33: regras permanentes do sorteio. */
export function DrawRulesForm({
  patotaId,
  members,
  rules,
}: {
  patotaId: string;
  members: { id: string; name: string }[];
  rules: RuleRow[];
}) {
  const notify = useNotify();
  const { run, pending } = useServerAction();
  const [kind, setKind] = useState<"TOGETHER" | "APART">("TOGETHER");
  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");
  const [state, formAction] = useActionState(async (prev: ActionResult, fd: FormData) => {
    const result = await addDrawRule(patotaId, prev, fd);
    if (result.ok) {
      notify(result);
      setFirstId("");
      setSecondId("");
    }
    return result;
  }, {});
  const errors = state.ok ? {} : (state.fieldErrors ?? {});

  return (
    <Stack spacing={2}>
      {rules.length > 0 ? (
        <List dense aria-label="Regras do sorteio">
          {rules.map((r) => (
            <ListItem
              key={r.id}
              disableGutters
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label={`Remover regra entre ${r.first} e ${r.second}`}
                  disabled={pending}
                  onClick={() => run(() => deleteDrawRule(patotaId, r.id))}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={`${r.first} e ${r.second}`}
                secondary={r.kind === "TOGETHER" ? "Sempre no mesmo time" : "Sempre em times diferentes"}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Nenhuma regra. Ex.: pai e filho que vão juntos; os dois melhores goleiros sempre separados.
        </Typography>
      )}

      <Stack component="form" action={formAction} spacing={2} noValidate>
        <FormFeedback state={state.ok ? {} : state} />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={kind}
          onChange={(_, v) => v && setKind(v)}
          aria-label="Tipo de regra"
        >
          <ToggleButton value="TOGETHER">Sempre juntos</ToggleButton>
          <ToggleButton value="APART">Sempre separados</ToggleButton>
        </ToggleButtonGroup>
        <input type="hidden" name="kind" value={kind} />
        <Grid container spacing={2}>
          {(
            [
              ["firstId", "Primeira pessoa", firstId, setFirstId],
              ["secondId", "Segunda pessoa", secondId, setSecondId],
            ] as const
          ).map(([name, label, value, set]) => (
            <Grid key={name} size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                name={name}
                label={label}
                value={value}
                onChange={(e) => set(e.target.value)}
                error={Boolean(errors[name])}
                helperText={errors[name]}
              >
                {members.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ))}
        </Grid>
        <SubmitButton variant="outlined" sx={{ alignSelf: "flex-start" }}>
          Adicionar regra
        </SubmitButton>
      </Stack>
    </Stack>
  );
}
