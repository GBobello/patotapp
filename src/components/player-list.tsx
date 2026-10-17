import type { ReactNode } from "react";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { POSITION_LABELS, type Position } from "@/domain/positions";

export type PlayerItem = {
  key: string;
  name: string;
  isMe?: boolean;
  image?: string | null;
  position: Position | null;
  detail?: string;
  action?: ReactNode;
};

/** Lista simples de jogadores com título e contagem — usada em presença e times. */
export function PlayerList({
  title,
  items,
  numbered,
  emptyText,
  headingId,
  countLabel,
}: {
  title: string;
  /** Texto da contagem; padrão é o número de itens. */
  countLabel?: string;
  items: PlayerItem[];
  numbered?: boolean;
  emptyText?: string;
  headingId: string;
}) {
  if (!items.length && !emptyText) return null;

  return (
    <Paper variant="outlined" component="section" aria-labelledby={headingId}>
      <Typography id={headingId} variant="subtitle1" component="h3" sx={{ px: 2, pt: 1.5, fontWeight: 600 }}>
        {title} ({countLabel ?? items.length})
      </Typography>
      {items.length === 0 ? (
        <Typography color="text.secondary" sx={{ px: 2, pb: 1.5 }}>
          {emptyText}
        </Typography>
      ) : (
        <List component={numbered ? "ol" : "ul"} dense>
          {items.map((p, i) => (
            <ListItem key={p.key} secondaryAction={p.action}>
              <ListItemAvatar>
                <Avatar aria-hidden src={p.image ?? undefined} alt="" sx={{ width: 32, height: 32, fontSize: 14 }}>
                  {numbered ? i + 1 : p.name.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={p.isMe ? `${p.name} (você)` : p.name}
                secondary={p.detail}
              />
              {p.position && (
                <Chip size="small" variant="outlined" label={POSITION_LABELS[p.position]} sx={{ mr: p.action ? 5 : 0 }} />
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
