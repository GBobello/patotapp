import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import { addGameComment, deleteGameComment } from "@/app/(app)/patotas/[id]/jogos/actions";
import { formatGameDate } from "@/domain/dates";
import { ActionButton } from "./action-button";
import { TextPostForm } from "./text-post-form";

export type CommentItem = {
  id: string;
  author: string;
  text: string;
  createdAt: Date;
  canDelete: boolean;
};

/** Comentários do jogo (RF47) — comunicação rápida sem sair do contexto do jogo. */
export function GameComments({ gameId, comments }: { gameId: string; comments: CommentItem[] }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }} component="section" aria-labelledby="comentarios-titulo" id="comentarios">
      <Typography id="comentarios-titulo" variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
        Comentários ({comments.length})
      </Typography>
      {comments.length > 0 && (
        <List dense>
          {comments.map((c) => (
            <ListItem
              key={c.id}
              disableGutters
              secondaryAction={
                c.canDelete ? (
                  <ActionButton
                    action={deleteGameComment.bind(null, c.id)}
                    aria-label={`Apagar comentário de ${c.author}`}
                    size="small"
                    sx={{ minWidth: 48 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </ActionButton>
                ) : undefined
              }
            >
              <ListItemText
                primary={c.text}
                secondary={`${c.author} · ${formatGameDate(c.createdAt)}`}
                slotProps={{ primary: { sx: { whiteSpace: "pre-wrap" } } }}
              />
            </ListItem>
          ))}
        </List>
      )}
      <Stack sx={{ mt: 1 }}>
        <TextPostForm
          action={addGameComment.bind(null, gameId)}
          label="Escreva um comentário"
          helper="Ex.: vou atrasar 10 minutos"
          submitLabel="Comentar"
          maxLength={300}
          minRows={1}
        />
      </Stack>
    </Paper>
  );
}
