"use client";

import { useMemo, useState } from "react";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import {
  deleteCharge,
  reportPayment,
  setChargeStatus,
} from "@/app/(app)/patotas/[id]/financeiro/actions";
import { CHARGE_STATUS_LABELS, type ChargeStatus, formatMoney } from "@/domain/billing";
import type { ActionResult } from "@/lib/forms";
import { useServerAction } from "./action-button";

export type ChargeRow = {
  id: string;
  memberName: string;
  description: string;
  amountCents: number;
  status: ChargeStatus;
  isMine: boolean;
};

// Status com ícone + texto, nunca só cor (WCAG 1.4.1).
const STATUS_STYLE: Record<ChargeStatus, { color: "default" | "warning" | "success" | "info"; icon: React.ReactElement }> = {
  PENDING: { color: "warning", icon: <ScheduleIcon /> },
  REPORTED: { color: "info", icon: <HourglassTopIcon /> },
  PAID: { color: "success", icon: <CheckCircleIcon /> },
  WAIVED: { color: "default", icon: <RemoveCircleOutlineIcon /> },
};

type Filter = "OPEN" | "REPORTED" | "PAID" | "ALL";
const FILTERS: Record<Filter, (s: ChargeStatus) => boolean> = {
  OPEN: (s) => s === "PENDING" || s === "REPORTED",
  REPORTED: (s) => s === "REPORTED",
  PAID: (s) => s === "PAID" || s === "WAIVED",
  ALL: () => true,
};

export function ChargesList({ charges, manager, showMember }: { charges: ChargeRow[]; manager: boolean; showMember: boolean }) {
  const [filter, setFilter] = useState<Filter>("OPEN");
  const visible = useMemo(() => charges.filter((c) => FILTERS[filter](c.status)), [charges, filter]);

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={filter}
        onChange={(_, v) => v && setFilter(v)}
        aria-label="Filtrar cobranças"
        sx={{ flexWrap: "wrap" }}
      >
        <ToggleButton value="OPEN">A receber</ToggleButton>
        <ToggleButton value="REPORTED">Para confirmar</ToggleButton>
        <ToggleButton value="PAID">Pagas</ToggleButton>
        <ToggleButton value="ALL">Todas</ToggleButton>
      </ToggleButtonGroup>

      <Paper variant="outlined">
        {visible.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 2 }} role="status">
            Nenhuma cobrança neste filtro.
          </Typography>
        ) : (
          <List disablePadding>
            {visible.map((c, i) => (
              <Stack key={c.id} component="li" sx={{ listStyle: "none" }}>
                {i > 0 && <Divider component="div" />}
                <ChargeItem charge={c} manager={manager} showMember={showMember} />
              </Stack>
            ))}
          </List>
        )}
      </Paper>
    </Stack>
  );
}

function ChargeItem({ charge: c, manager, showMember }: { charge: ChargeRow; manager: boolean; showMember: boolean }) {
  const { run, pending } = useServerAction();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const style = STATUS_STYLE[c.status];
  const act = (fn: () => Promise<ActionResult>) => {
    setAnchor(null);
    run(fn);
  };

  return (
    <ListItem component="div" sx={{ flexWrap: "wrap", gap: 1 }}>
      <ListItemText
        primary={showMember ? c.memberName : c.description}
        secondary={showMember ? c.description : undefined}
        sx={{ flex: "1 1 200px" }}
      />
      <Typography sx={{ fontWeight: 600, minWidth: 90, textAlign: "right" }}>{formatMoney(c.amountCents)}</Typography>
      <Chip size="small" color={style.color} icon={style.icon} label={CHARGE_STATUS_LABELS[c.status]} />

      {c.isMine && c.status === "PENDING" && (
        <Button size="small" variant="contained" disabled={pending} onClick={() => run(() => reportPayment(c.id))}>
          Já paguei
        </Button>
      )}
      {manager && c.status === "REPORTED" && (
        <Button size="small" variant="contained" disabled={pending} onClick={() => run(() => setChargeStatus(c.id, "PAID"))}>
          Confirmar
        </Button>
      )}
      {manager && (
        <>
          <IconButton
            aria-label={`Mais ações para a cobrança de ${c.memberName}`}
            aria-haspopup="menu"
            disabled={pending}
            onClick={(e) => setAnchor(e.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            {c.status !== "PAID" && <MenuItem onClick={() => act(() => setChargeStatus(c.id, "PAID"))}>Marcar como pago</MenuItem>}
            {c.status !== "WAIVED" && <MenuItem onClick={() => act(() => setChargeStatus(c.id, "WAIVED"))}>Isentar</MenuItem>}
            {c.status !== "PENDING" && <MenuItem onClick={() => act(() => setChargeStatus(c.id, "PENDING"))}>Reabrir</MenuItem>}
            <MenuItem sx={{ color: "error.main" }} onClick={() => act(() => deleteCharge(c.id))}>
              Excluir cobrança
            </MenuItem>
          </Menu>
        </>
      )}
    </ListItem>
  );
}
