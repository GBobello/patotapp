import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { formatGameDate, relativeDay } from "@/domain/dates";
import { ListItemLink } from "./list-item-link";

export type ActivityItem = {
  id: string;
  message: string;
  href: string | null;
  createdAt: Date;
  patotaName?: string;
  unread?: boolean;
};

/** Linha do tempo de acontecimentos (RF49) — Mecanismo de Percepção do M3C. */
export function ActivityList({ items, emptyText }: { items: ActivityItem[]; emptyText: string }) {
  if (!items.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        {emptyText}
      </Typography>
    );
  }

  return (
    <Paper variant="outlined">
      <List>
        {items.map((a) => {
          const text = (
            <ListItemText
              primary={
                <>
                  {a.unread && (
                    <span
                      aria-hidden
                      style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: "currentColor", marginRight: 8 }}
                    />
                  )}
                  {a.unread && <span className="visually-hidden">Nova: </span>}
                  {a.message}
                </>
              }
              secondary={`${a.patotaName ? `${a.patotaName} · ` : ""}${relativeDay(a.createdAt)} · ${formatGameDate(a.createdAt)}`}
              slotProps={{ primary: { sx: { fontWeight: a.unread ? 600 : 400 } } }}
            />
          );
          return a.href ? (
            <ListItemLink key={a.id} href={a.href}>
              {text}
            </ListItemLink>
          ) : (
            <ListItem key={a.id}>{text}</ListItem>
          );
        })}
      </List>
    </Paper>
  );
}
