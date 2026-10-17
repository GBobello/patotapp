"use client";

import { useActionState } from "react";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ActionResult } from "@/lib/forms";
import { FormFeedback, SubmitButton } from "./feedback";

export type ResultPlayer = { membershipId: string; name: string; attended: boolean; goals: number };

/** RF52: presença real, gols e placar, preenchidos pelo organizador depois do jogo. */
export function GameResultForm({
  action,
  players,
  teamNames,
  scores,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  players: ResultPlayer[];
  teamNames: string[];
  scores: number[];
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <Stack component="form" action={formAction} spacing={2} noValidate>
      <FormFeedback state={state} />

      {teamNames.length > 0 && (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <Typography component="legend" variant="subtitle2" sx={{ mb: 1 }}>
            Placar (deixe vazio se não marcaram)
          </Typography>
          <Grid container spacing={2}>
            {teamNames.map((name, i) => (
              <Grid key={name} size={{ xs: 6, sm: 3 }}>
                <TextField
                  name={`score:${i}`}
                  type="number"
                  label={`Gols do ${name}`}
                  defaultValue={scores[i] ?? ""}
                  slotProps={{ htmlInput: { min: 0, max: 99, inputMode: "numeric" } }}
                />
              </Grid>
            ))}
          </Grid>
        </fieldset>
      )}

      <Table size="small" aria-label="Presença real e gols">
        <TableHead>
          <TableRow>
            <TableCell>Jogador</TableCell>
            <TableCell align="center">Compareceu</TableCell>
            <TableCell align="center">Gols</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {players.map((p) => (
            <TableRow key={p.membershipId}>
              <TableCell component="th" scope="row">
                {p.name}
              </TableCell>
              <TableCell align="center" padding="checkbox">
                <Checkbox
                  name={`attended:${p.membershipId}`}
                  defaultChecked={p.attended}
                  slotProps={{ input: { "aria-label": `${p.name} compareceu` } }}
                />
              </TableCell>
              <TableCell align="center">
                <TextField
                  name={`goals:${p.membershipId}`}
                  type="number"
                  size="small"
                  defaultValue={p.goals || ""}
                  fullWidth={false}
                  sx={{ width: 80 }}
                  slotProps={{ htmlInput: { min: 0, max: 50, inputMode: "numeric", "aria-label": `Gols de ${p.name}` } }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SubmitButton sx={{ alignSelf: "flex-start" }}>Salvar resultado</SubmitButton>
    </Stack>
  );
}
