"use client";

import { useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import type { ActionResult } from "@/lib/forms";
import { useServerAction } from "./action-button";

/** Interruptor de configuração que salva na hora (server action já ligada ao id da patota). */
export function SettingSwitch({
  action,
  initial,
  label,
  description,
}: {
  action: (enabled: boolean) => Promise<ActionResult>;
  initial: boolean;
  label: string;
  description: string;
}) {
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
              run(() => action(e.target.checked));
            }}
          />
        }
        label={label}
      />
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </>
  );
}
