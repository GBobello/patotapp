"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  addGameTask,
  deleteGameTask,
  releaseGameTask,
  takeGameTask,
} from "@/app/(app)/patotas/[id]/jogos/actions";
import { useServerAction } from "./action-button";

export type TaskRow = { id: string; title: string; assignee: string | null; mine: boolean };

const SUGGESTIONS = ["Levar bola", "Levar coletes", "Levar água", "Levar bomba de encher bola"];

/** RF51: tarefas do jogo — cooperação (M3C): cada um assume uma parte. */
export function GameTasks({
  gameId,
  tasks,
  manager,
  disabled,
}: {
  gameId: string;
  tasks: TaskRow[];
  manager: boolean;
  disabled?: boolean;
}) {
  const { run, pending } = useServerAction();
  const [title, setTitle] = useState("");
  const missing = SUGGESTIONS.filter((s) => !tasks.some((t) => t.title.toLowerCase() === s.toLowerCase()));
  const open = tasks.filter((t) => !t.assignee).length;

  return (
    <Paper variant="outlined" sx={{ p: 2 }} component="section" aria-labelledby="tarefas">
      <Typography id="tarefas" variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
        Quem leva o quê? ({tasks.length - open} de {tasks.length} com dono)
      </Typography>

      {tasks.length > 0 && (
        <List dense>
          {tasks.map((t) => (
            <ListItem
              key={t.id}
              disableGutters
              sx={{ flexWrap: "wrap", gap: 1 }}
              secondaryAction={
                manager ? (
                  <IconButton
                    edge="end"
                    aria-label={`Remover tarefa ${t.title}`}
                    disabled={pending}
                    onClick={() => run(() => deleteGameTask(t.id))}
                  >
                    <DeleteIcon />
                  </IconButton>
                ) : undefined
              }
            >
              <ListItemText
                primary={t.title}
                secondary={t.assignee ? `Com ${t.mine ? "você" : t.assignee}` : "Sem dono ainda"}
                sx={{ flex: "1 1 160px" }}
              />
              {!t.assignee && !disabled && (
                <Button size="small" variant="contained" disabled={pending} onClick={() => run(() => takeGameTask(t.id))} sx={{ mr: manager ? 6 : 0 }}>
                  Eu levo
                </Button>
              )}
              {t.assignee && (t.mine || manager) && !disabled && (
                <Button size="small" disabled={pending} onClick={() => run(() => releaseGameTask(t.id))} sx={{ mr: manager ? 6 : 0 }}>
                  {t.mine ? "Não vou conseguir" : "Liberar"}
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      )}

      {!disabled && (
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {missing.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }} role="group" aria-label="Sugestões de tarefas">
              {missing.map((s) => (
                <Chip
                  key={s}
                  icon={<AddIcon />}
                  label={s}
                  variant="outlined"
                  disabled={pending}
                  onClick={() => run(() => addGameTask(gameId, s))}
                />
              ))}
            </Stack>
          )}
          <Stack
            component="form"
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            onSubmit={(e) => {
              e.preventDefault();
              const value = title;
              run(async () => {
                const r = await addGameTask(gameId, value, true);
                if (r.ok) setTitle("");
                return r;
              });
            }}
          >
            <TextField
              size="small"
              label="Outra tarefa (você assume)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 60 } }}
            />
            <Button type="submit" variant="outlined" disabled={pending || title.trim().length < 2} sx={{ flexShrink: 0 }}>
              Adicionar
            </Button>
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}
