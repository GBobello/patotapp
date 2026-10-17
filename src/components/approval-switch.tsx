"use client";

import { useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { setRequireApproval } from "@/app/(app)/patotas/[id]/actions";
import { useServerAction } from "./action-button";

/** RF10: liga/desliga a aprovação de quem entra pelo link de convite. */
export function ApprovalSwitch({ patotaId, initial }: { patotaId: string; initial: boolean }) {
  const [checked, setChecked] = useState(initial);
  const { run, pending } = useServerAction();

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            disabled={pending}
            onChange={(e) => {
              setChecked(e.target.checked);
              run(() => setRequireApproval(patotaId, e.target.checked));
            }}
          />
        }
        label="Aprovar quem entra pelo link"
      />
      <Typography variant="body2" color="text.secondary">
        Ligado: quem usar o convite vira um pedido em Integrantes, e só entra depois que um organizador aprovar.
      </Typography>
    </>
  );
}
