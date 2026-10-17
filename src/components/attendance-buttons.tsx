"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import { respond } from "@/app/(app)/patotas/[id]/jogos/actions";
import type { AttendanceStatus, Response } from "@/domain/attendance";
import { useServerAction } from "./action-button";

const OPTIONS: { value: Response; label: string; icon: React.ReactNode; color: "primary" | "secondary" | "error" }[] = [
  { value: "CONFIRMED", label: "Vou", icon: <CheckIcon />, color: "primary" },
  { value: "MAYBE", label: "Talvez", icon: <HelpOutlineIcon />, color: "secondary" },
  { value: "DECLINED", label: "Não vou", icon: <CloseIcon />, color: "error" },
];

/**
 * Confirmação em um toque (RF18, RNF13). O estado atual é indicado por cor, ícone,
 * preenchimento do botão e `aria-pressed` — nunca só pela cor (WCAG 1.4.1).
 */
export function AttendanceButtons({
  gameId,
  current,
  disabled,
  gameLabel,
}: {
  gameId: string;
  current: AttendanceStatus | null;
  disabled?: boolean;
  gameLabel: string;
}) {
  const { run, pending } = useServerAction();
  const selected: Response | null = current === "WAITLIST" ? "CONFIRMED" : current;

  return (
    <Stack direction="row" spacing={1} role="group" aria-label={`Sua presença no jogo de ${gameLabel}`}>
      {OPTIONS.map((o) => {
        const isOn = selected === o.value;
        return (
          <Button
            key={o.value}
            variant={isOn ? "contained" : "outlined"}
            color={o.color}
            startIcon={o.icon}
            aria-pressed={isOn}
            disabled={disabled || pending}
            onClick={() => run(() => respond(gameId, o.value))}
            sx={{ flex: 1, px: 1.5 }}
          >
            {o.label}
          </Button>
        );
      })}
    </Stack>
  );
}
