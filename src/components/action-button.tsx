"use client";

import { useState, useTransition, type ReactNode } from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import type { ActionResult } from "@/lib/forms";
import { useNotify } from "./feedback";

export type ConfirmOptions = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
};

/** Diálogo de confirmação para ações destrutivas (Heurística 5: prevenção de erros). */
export function ConfirmDialog({
  open,
  options,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  options: ConfirmOptions;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="confirm-title" aria-describedby="confirm-desc">
      <DialogTitle id="confirm-title">{options.title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-desc" component="div">
          {options.description}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} autoFocus>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={options.destructive ? "error" : "primary"}
          disabled={pending}
        >
          {options.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Hook: executa uma server action, mostra o resultado e opcionalmente pede confirmação antes. */
export function useServerAction() {
  const notify = useNotify();
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult | void>) =>
    startTransition(async () => {
      const result = await action();
      if (result) notify(result);
    });

  return { run, pending };
}

/** Botão que dispara uma server action (já com os argumentos ligados via .bind no servidor). */
export function ActionButton({
  action,
  confirm,
  children,
  ...buttonProps
}: Omit<ButtonProps, "action"> & {
  action: () => Promise<ActionResult | void>;
  confirm?: ConfirmOptions;
}) {
  const { run, pending } = useServerAction();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        {...buttonProps}
        disabled={pending || buttonProps.disabled}
        onClick={() => (confirm ? setOpen(true) : run(action))}
      >
        {children}
      </Button>
      {confirm && (
        <ConfirmDialog
          open={open}
          options={confirm}
          pending={pending}
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            setOpen(false);
            run(action);
          }}
        />
      )}
    </>
  );
}
