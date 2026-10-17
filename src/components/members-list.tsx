"use client";

import { useMemo, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  changeMemberRole,
  changeMemberType,
  removeMember,
  setRating,
} from "@/app/(app)/patotas/[id]/actions";
import { POSITION_LABELS, type Position } from "@/domain/positions";
import { RATING_LABELS } from "@/domain/members";
import { MEMBER_TYPE_LABELS, ROLE_LABELS, ROLES, type MemberType, type Role } from "@/domain/roles";
import { ConfirmDialog, useServerAction } from "./action-button";

export type MemberRow = {
  id: string;
  name: string;
  image: string | null;
  role: Role;
  type: MemberType;
  primaryPosition: Position | null;
  isMe: boolean;
  isGuest: boolean;
  /** Só enviado para organizadores (RF27). */
  rating?: number;
};

type Props = {
  patotaId: string;
  members: MemberRow[];
  canManage: boolean;
  isOrganizer: boolean;
};

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Lista de integrantes com busca e filtro (RF15) e ações de gestão (RF11, RF12, RF14). */
export function MembersList({ patotaId, members, canManage, isOrganizer }: Props) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<MemberType | "ALL">("ALL");

  const filtered = useMemo(
    () =>
      members.filter(
        (m) => (type === "ALL" || m.type === type) && normalize(m.name).includes(normalize(query)),
      ),
    [members, query, type],
  );

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField
          label="Buscar integrante"
          type="search"
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={type}
          onChange={(_, v) => v && setType(v)}
          aria-label="Filtrar por tipo"
        >
          <ToggleButton value="ALL">Todos</ToggleButton>
          <ToggleButton value="MENSALISTA">Mensalistas</ToggleButton>
          <ToggleButton value="DIARISTA">Diaristas</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Typography role="status" variant="body2" color="text.secondary">
        {filtered.length} de {members.length} {members.length === 1 ? "integrante" : "integrantes"}
      </Typography>

      <Paper variant="outlined">
        <List disablePadding>
          {filtered.map((m, i) => (
            <Stack key={m.id} component="li" sx={{ listStyle: "none" }}>
              {i > 0 && <Divider component="div" />}
              <ListItem
                component="div"
                sx={{ flexWrap: "wrap" }}
                secondaryAction={
                  canManage && !m.isMe ? (
                    <MemberMenu patotaId={patotaId} member={m} isOrganizer={isOrganizer} />
                  ) : undefined
                }
              >
                <ListItemAvatar>
                  <Avatar src={m.image ?? undefined} alt="">
                    {m.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={m.isMe ? `${m.name} (você)` : m.name}
                  secondary={
                    <Stack component="span" direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5, mt: 0.5 }}>
                      {m.role !== "PLAYER" && <Chip component="span" size="small" color="primary" label={ROLE_LABELS[m.role]} />}
                      {m.isGuest && <Chip component="span" size="small" color="secondary" label="Convidado" />}
                      <Chip component="span" size="small" variant="outlined" label={MEMBER_TYPE_LABELS[m.type]} />
                      <Chip
                        component="span"
                        size="small"
                        variant="outlined"
                        label={m.primaryPosition ? POSITION_LABELS[m.primaryPosition] : "Sem posição"}
                      />
                    </Stack>
                  }
                  slotProps={{ secondary: { component: "div" } }}
                />
                {canManage && m.rating !== undefined && (
                  <MemberRating patotaId={patotaId} member={m} />
                )}
              </ListItem>
            </Stack>
          ))}
        </List>
      </Paper>
    </Stack>
  );
}

function MemberMenu({ patotaId, member, isOrganizer }: { patotaId: string; member: MemberRow; isOrganizer: boolean }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const { run, pending } = useServerAction();
  const close = () => setAnchor(null);
  const otherType: MemberType = member.type === "MENSALISTA" ? "DIARISTA" : "MENSALISTA";

  return (
    <>
      <IconButton
        edge="end"
        aria-label={`Ações para ${member.name}`}
        aria-haspopup="menu"
        onClick={(e) => setAnchor(e.currentTarget)}
        disabled={pending}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem
          onClick={() => {
            close();
            run(() => changeMemberType(patotaId, member.id, otherType));
          }}
        >
          Tornar {MEMBER_TYPE_LABELS[otherType].toLowerCase()}
        </MenuItem>
        {isOrganizer && !member.isGuest && <ListSubheader>Papel</ListSubheader>}
        {isOrganizer &&
          !member.isGuest &&
          ROLES.filter((r) => r !== member.role).map((r) => (
            <MenuItem
              key={r}
              onClick={() => {
                close();
                run(() => changeMemberRole(patotaId, member.id, r));
              }}
            >
              Tornar {ROLE_LABELS[r].toLowerCase()}
            </MenuItem>
          ))}
        <Divider />
        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            close();
            setConfirmRemove(true);
          }}
        >
          Remover da patota
        </MenuItem>
      </Menu>
      <ConfirmDialog
        open={confirmRemove}
        pending={pending}
        options={{
          title: `Remover ${member.name}?`,
          description: "A pessoa sai da patota. Ela pode voltar depois pelo link de convite.",
          confirmLabel: "Remover",
          destructive: true,
        }}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          run(() => removeMember(patotaId, member.id));
        }}
      />
    </>
  );
}

/** Nota de 1 a 5 (RF26) — salva ao escolher. O MUI Rating é um grupo de rádios acessível. */
function MemberRating({ patotaId, member }: { patotaId: string; member: MemberRow }) {
  const [value, setValue] = useState(member.rating ?? 3);
  const { run, pending } = useServerAction();

  return (
    <Stack
      direction={{ xs: "row", sm: "column" }}
      spacing={{ xs: 1, sm: 0 }}
      sx={{ alignItems: "center", mr: { sm: 6 }, ml: { xs: 7, sm: 0 }, width: { xs: "100%", sm: "auto" } }}
    >
      <Rating
        name={`nota-${member.id}`}
        value={value}
        disabled={pending}
        getLabelText={(v) => `${v} de 5 — ${RATING_LABELS[v]}`}
        onChange={(_, v) => {
          if (!v) return;
          setValue(v);
          run(() => setRating(patotaId, member.id, v));
        }}
        aria-label={`Nota de ${member.name}`}
      />
      <Typography variant="caption" color="text.secondary">
        {RATING_LABELS[value]}
      </Typography>
    </Stack>
  );
}
