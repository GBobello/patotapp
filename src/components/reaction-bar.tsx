"use client";

import { useOptimistic, useTransition } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { toggleReaction } from "@/app/(app)/patotas/[id]/mural/actions";
import { REACTIONS } from "@/domain/reactions";

type Counts = Record<string, { count: number; mine: boolean }>;

/** Reações com atualização otimista: a tela responde na hora (Heurística 1). */
export function ReactionBar({ announcementId, initial }: { announcementId: string; initial: Counts }) {
  const [, startTransition] = useTransition();
  const [counts, toggle] = useOptimistic(initial, (state: Counts, emoji: string) => {
    const cur = state[emoji] ?? { count: 0, mine: false };
    return { ...state, [emoji]: { count: cur.count + (cur.mine ? -1 : 1), mine: !cur.mine } };
  });

  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
      {REACTIONS.map(({ emoji, label }) => {
        const c = counts[emoji] ?? { count: 0, mine: false };
        return (
          <Button
            key={emoji}
            size="small"
            variant={c.mine ? "contained" : "outlined"}
            color={c.mine ? "primary" : "inherit"}
            aria-pressed={c.mine}
            aria-label={`${label}: ${c.count} ${c.count === 1 ? "reação" : "reações"}`}
            onClick={() =>
              startTransition(async () => {
                toggle(emoji);
                await toggleReaction(announcementId, emoji);
              })
            }
            sx={{ minWidth: 0, px: 1.5 }}
          >
            <span aria-hidden>
              {emoji} {c.count > 0 ? c.count : ""}
            </span>
          </Button>
        );
      })}
    </Stack>
  );
}
