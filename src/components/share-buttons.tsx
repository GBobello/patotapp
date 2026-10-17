"use client";

import Button from "@mui/material/Button";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useNotify } from "./feedback";

/** Copia um texto para a área de transferência e confirma para o usuário. */
export function CopyButton({ text, label = "Copiar", successMessage = "Copiado!" }: {
  text: string;
  label?: string;
  successMessage?: string;
}) {
  const notify = useNotify();
  return (
    <Button
      variant="outlined"
      startIcon={<ContentCopyIcon />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          notify({ message: successMessage });
        } catch {
          notify({ error: "Não foi possível copiar. Selecione o texto e copie manualmente." });
        }
      }}
    >
      {label}
    </Button>
  );
}

/** Abre o WhatsApp com a mensagem pronta (RF24, RF35). */
export function WhatsAppButton({ text, label = "Enviar no WhatsApp" }: { text: string; label?: string }) {
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<WhatsAppIcon />}
      href={`https://wa.me/?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
      <span className="visually-hidden"> (abre em nova janela)</span>
    </Button>
  );
}
