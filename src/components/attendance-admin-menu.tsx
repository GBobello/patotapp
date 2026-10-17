"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import EditIcon from "@mui/icons-material/Edit";
import { setAttendance } from "@/app/(app)/patotas/[id]/jogos/actions";
import type { AttendanceStatus } from "@/domain/attendance";
import { useServerAction } from "./action-button";

const CHOICES = [
  { value: "CONFIRMED", label: "Confirmar presença" },
  { value: "MAYBE", label: "Marcar talvez" },
  { value: "DECLINED", label: "Marcar que não vai" },
  { value: "NONE", label: "Limpar resposta" },
] as const;

/** Organizador ajusta a presença de alguém (RF22). */
export function AttendanceAdminMenu({
  gameId,
  membershipId,
  name,
  current,
}: {
  gameId: string;
  membershipId: string;
  name: string;
  current: AttendanceStatus | null;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { run, pending } = useServerAction();

  const isCurrent = (v: string) => v === current || (v === "CONFIRMED" && current === "WAITLIST") || (v === "NONE" && !current);

  return (
    <>
      <IconButton
        edge="end"
        aria-label={`Alterar presença de ${name}`}
        aria-haspopup="menu"
        onClick={(e) => setAnchor(e.currentTarget)}
        disabled={pending}
      >
        <EditIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {CHOICES.map((c) => (
          <MenuItem
            key={c.value}
            disabled={isCurrent(c.value)}
            onClick={() => {
              setAnchor(null);
              run(() => setAttendance(gameId, membershipId, c.value));
            }}
          >
            {c.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
