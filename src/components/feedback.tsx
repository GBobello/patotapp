"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Button, { type ButtonProps } from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/forms";

// ---------- Avisos rápidos (Snackbar) — Heurística 1: visibilidade do estado do sistema ----------

type Notify = (result: ActionResult) => void;
const NotifyContext = createContext<Notify>(() => {});

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<{ text: string; error: boolean; key: number } | null>(null);

  const notify = useCallback<Notify>((result) => {
    const text = result.error ?? result.message;
    if (text) setCurrent({ text, error: Boolean(result.error), key: Date.now() });
  }, []);

  return (
    <NotifyContext value={notify}>
      {children}
      <Snackbar
        key={current?.key}
        open={Boolean(current)}
        autoHideDuration={current?.error ? 8000 : 4000}
        onClose={(_, reason) => reason !== "clickaway" && setCurrent(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={current?.error ? "error" : "success"}
          variant="filled"
          onClose={() => setCurrent(null)}
          role={current?.error ? "alert" : "status"}
          sx={{ width: "100%" }}
        >
          {current?.text}
        </Alert>
      </Snackbar>
    </NotifyContext>
  );
}

export function useNotify() {
  return useContext(NotifyContext);
}

// ---------- Formulários ----------

/** Botão de envio que se desativa e muda o texto enquanto o formulário é processado. */
export function SubmitButton({
  children,
  pendingText = "Salvando…",
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="contained" disabled={pending || props.disabled} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}

/** Mensagem de sucesso/erro geral do formulário, anunciada por leitores de tela. */
export function FormFeedback({ state }: { state: ActionResult }) {
  return (
    <div role="status" aria-live="polite">
      {state.error && <Alert severity="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert severity="success">{state.message}</Alert>}
    </div>
  );
}
