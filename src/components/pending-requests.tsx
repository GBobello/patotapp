import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { approveMember, rejectMember } from "@/app/(app)/patotas/[id]/actions";
import { formatGameDate } from "@/domain/dates";
import { ActionButton } from "./action-button";

type Request = { id: string; name: string; email: string; createdAt: Date };

/** RF10: pedidos de entrada aguardando um organizador. */
export function PendingRequests({ patotaId, requests }: { patotaId: string; requests: Request[] }) {
  return (
    <Paper variant="outlined" component="section" aria-labelledby="pedidos" sx={{ borderColor: "primary.main" }}>
      <Typography id="pedidos" variant="subtitle1" component="h2" sx={{ px: 2, pt: 1.5, fontWeight: 600 }}>
        Pedidos para entrar ({requests.length})
      </Typography>
      <Alert severity="info" sx={{ mx: 2, mt: 1 }}>
        Só aprove quem você conhece. Integrantes veem a lista, os jogos e o mural.
      </Alert>
      <List>
        {requests.map((r) => (
          <ListItem key={r.id} sx={{ flexWrap: "wrap", gap: 1 }}>
            <ListItemText
              primary={r.name}
              secondary={`${r.email} · pediu ${formatGameDate(r.createdAt)}`}
              sx={{ flex: "1 1 220px" }}
            />
            <Stack direction="row" spacing={1}>
              <ActionButton action={approveMember.bind(null, patotaId, r.id)} variant="contained" aria-label={`Aprovar ${r.name}`}>
                Aprovar
              </ActionButton>
              <ActionButton
                action={rejectMember.bind(null, patotaId, r.id)}
                color="error"
                aria-label={`Recusar ${r.name}`}
                confirm={{
                  title: `Recusar o pedido de ${r.name}?`,
                  description: "A pessoa não entra na patota. Ela pode pedir de novo pelo link.",
                  confirmLabel: "Recusar",
                  destructive: true,
                }}
              >
                Recusar
              </ActionButton>
            </Stack>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
