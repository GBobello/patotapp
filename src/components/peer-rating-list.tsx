"use client";

import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ratePeer } from "@/app/(app)/patotas/[id]/actions";
import { POSITION_LABELS, type Position } from "@/domain/positions";
import { RATING_LABELS } from "@/domain/members";
import { useServerAction } from "./action-button";

export type PeerRow = { id: string; name: string; image: string | null; position: Position | null; myRating: number | null };

/** RF28: cada integrante dá uma nota de 1 a 5 aos colegas. Salva ao escolher. */
export function PeerRatingList({ patotaId, peers }: { patotaId: string; peers: PeerRow[] }) {
  const done = peers.filter((p) => p.myRating !== null).length;

  return (
    <Stack spacing={1.5}>
      <Typography role="status">
        Você avaliou {done} de {peers.length} {peers.length === 1 ? "colega" : "colegas"}.
      </Typography>
      <Paper variant="outlined">
        <List>
          {peers.map((p) => (
            <PeerItem key={p.id} patotaId={patotaId} peer={p} />
          ))}
        </List>
      </Paper>
    </Stack>
  );
}

function PeerItem({ patotaId, peer }: { patotaId: string; peer: PeerRow }) {
  const [value, setValue] = useState<number | null>(peer.myRating);
  const { run, pending } = useServerAction();

  return (
    <ListItem sx={{ flexWrap: "wrap", gap: 1 }}>
      <ListItemAvatar>
        <Avatar src={peer.image ?? undefined} alt="">
          {peer.name.charAt(0).toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={peer.name}
        secondary={peer.position ? POSITION_LABELS[peer.position] : "Sem posição"}
        sx={{ flex: "1 1 160px" }}
      />
      <Stack sx={{ alignItems: "center" }}>
        <Rating
          name={`avaliar-${peer.id}`}
          value={value}
          disabled={pending}
          getLabelText={(v) => `${v} de 5 — ${RATING_LABELS[v]}`}
          onChange={(_, v) => {
            if (!v) return;
            setValue(v);
            run(() => ratePeer(patotaId, peer.id, v));
          }}
          aria-label={`Sua nota para ${peer.name}`}
        />
        <Typography variant="caption" color="text.secondary">
          {value ? RATING_LABELS[value] : "Sem nota"}
        </Typography>
      </Stack>
    </ListItem>
  );
}
