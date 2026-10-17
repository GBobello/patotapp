"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { moveDrawPlayer } from "@/app/(app)/patotas/[id]/jogos/actions";
import { useServerAction } from "./action-button";

/**
 * Ajuste manual dos times (RF34). Um menu "Mover para…" em vez de arrastar e soltar,
 * para funcionar com teclado e leitor de tela (WCAG 2.1.1, 2.5.7).
 */
export function MovePlayerMenu({
  gameId,
  membershipId,
  name,
  currentTeam,
  teamNames,
}: {
  gameId: string;
  membershipId: string;
  name: string;
  currentTeam: number;
  teamNames: string[];
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { run, pending } = useServerAction();

  return (
    <>
      <IconButton
        edge="end"
        size="small"
        aria-label={`Mover ${name} para outro time`}
        aria-haspopup="menu"
        disabled={pending}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        <SwapHorizIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {teamNames.map((team, i) =>
          i === currentTeam ? null : (
            <MenuItem
              key={team}
              onClick={() => {
                setAnchor(null);
                run(() => moveDrawPlayer(gameId, membershipId, i));
              }}
            >
              Mover para {team}
            </MenuItem>
          ),
        )}
      </Menu>
    </>
  );
}
