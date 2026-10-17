"use client";

import { useTransition } from "react";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import { useColorScheme } from "@mui/material/styles";
import { savePreference } from "@/app/(app)/perfil/preferences-actions";
import { FONT_SCALES, FONT_SCALE_LABELS, type Preferences } from "@/lib/preferences";

/** RF06: tema, tamanho da fonte, alto contraste e menos animação. */
export function AccessibilityPreferences({ initial }: { initial: Preferences }) {
  const { mode, setMode } = useColorScheme();
  const [pending, startTransition] = useTransition();
  const save = (name: string, value: string | boolean) => startTransition(() => savePreference({ name, value }));

  return (
    <Stack spacing={3}>
      <FormControl component="fieldset">
        <FormLabel component="legend">Tema</FormLabel>
        <RadioGroup row value={mode ?? "system"} onChange={(e) => setMode(e.target.value as "light" | "dark" | "system")}>
          <FormControlLabel value="system" control={<Radio />} label="Automático (do aparelho)" />
          <FormControlLabel value="light" control={<Radio />} label="Claro" />
          <FormControlLabel value="dark" control={<Radio />} label="Escuro" />
        </RadioGroup>
      </FormControl>

      <FormControl component="fieldset" disabled={pending}>
        <FormLabel component="legend">Tamanho do texto</FormLabel>
        <RadioGroup row defaultValue={initial.fontScale} onChange={(e) => save("fontScale", e.target.value)}>
          {FONT_SCALES.map((s) => (
            <FormControlLabel key={s} value={s} control={<Radio />} label={FONT_SCALE_LABELS[s]} />
          ))}
        </RadioGroup>
      </FormControl>

      <Stack>
        <FormControlLabel
          control={<Switch defaultChecked={initial.highContrast} onChange={(e) => save("highContrast", e.target.checked)} />}
          label="Alto contraste"
          disabled={pending}
        />
        <FormControlLabel
          control={<Switch defaultChecked={initial.reduceMotion} onChange={(e) => save("reduceMotion", e.target.checked)} />}
          label="Reduzir animações"
          disabled={pending}
        />
      </Stack>
    </Stack>
  );
}
