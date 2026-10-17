"use client";

import { useActionState, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { addGuest } from "@/app/(app)/patotas/[id]/actions";
import type { ActionResult } from "@/lib/forms";
import { RATING_LABELS } from "@/domain/members";
import { POSITIONS, POSITION_LABELS } from "@/domain/positions";
import { SubmitButton, useNotify } from "./feedback";

/** RF13: organizador cadastra um convidado que não tem conta no app. */
export function AddGuestDialog({ patotaId }: { patotaId: string }) {
  const [open, setOpen] = useState(false);
  const notify = useNotify();
  const [state, formAction] = useActionState(async (prev: ActionResult, formData: FormData) => {
    const result = await addGuest(patotaId, prev, formData);
    if (result.ok) {
      notify(result);
      setOpen(false);
    }
    return result;
  }, {});
  const errors = state.ok ? {} : (state.fieldErrors ?? {});

  return (
    <>
      <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setOpen(true)}>
        Adicionar convidado
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="guest-title" fullWidth maxWidth="xs">
        <form action={formAction} noValidate>
          <DialogTitle id="guest-title">Adicionar convidado</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                name="guestName"
                label="Nome"
                required
                autoFocus
                defaultValue={state.values?.guestName}
                error={Boolean(errors.guestName)}
                helperText={errors.guestName ?? "Para quem joga de vez em quando e não tem o app."}
              />
              <TextField
                select
                name="guestPosition"
                label="Posição"
                required
                defaultValue={state.values?.guestPosition ?? ""}
                error={Boolean(errors.guestPosition)}
                helperText={errors.guestPosition}
              >
                {POSITIONS.map((p) => (
                  <MenuItem key={p} value={p}>
                    {POSITION_LABELS[p]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select name="rating" label="Nota" defaultValue={state.values?.rating ?? "3"}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <MenuItem key={n} value={String(n)}>
                    {n} — {RATING_LABELS[n]}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton pendingText="Adicionando…">Adicionar</SubmitButton>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
