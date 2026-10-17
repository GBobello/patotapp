"use client";

import { useActionState, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { POSITIONS, POSITION_LABELS, type Position } from "@/domain/positions";
import { updateProfile, type ProfileState } from "./actions";

type Props = {
  initial: {
    name: string;
    nickname: string;
    phone: string;
    primaryPosition: Position | "";
    secondaryPositions: Position[];
  };
};

export function ProfileForm({ initial }: Props) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  // Campos controlados: o React 19 limpa campos não controlados após enviar o formulário.
  const [values, setValues] = useState(initial);
  const errors = state.fieldErrors ?? {};

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const toggleSecondary = (position: Position, checked: boolean) =>
    set(
      "secondaryPositions",
      checked ? [...values.secondaryPositions, position] : values.secondaryPositions.filter((p) => p !== position),
    );

  return (
    <Stack component="form" action={formAction} spacing={3} noValidate>
      {/* Mensagem de sucesso anunciada por leitores de tela (WCAG 4.1.3). */}
      <div role="status" aria-live="polite">
        {state.ok && !pending && <Alert severity="success">Perfil salvo!</Alert>}
      </div>

      <TextField
        name="name"
        label="Nome completo"
        autoComplete="name"
        required
        value={values.name}
        onChange={(e) => set("name", e.target.value)}
        error={Boolean(errors.name)}
        helperText={errors.name}
      />
      <TextField
        name="nickname"
        label="Apelido na patota (opcional)"
        autoComplete="nickname"
        value={values.nickname}
        onChange={(e) => set("nickname", e.target.value)}
        error={Boolean(errors.nickname)}
        helperText={errors.nickname ?? "É como os amigos vão ver você nas listas e nos times."}
      />
      <TextField
        name="phone"
        type="tel"
        label="Celular / WhatsApp (opcional)"
        autoComplete="tel"
        inputMode="tel"
        value={values.phone}
        onChange={(e) => set("phone", e.target.value)}
        error={Boolean(errors.phone)}
        helperText={errors.phone}
      />

      <FormControl component="fieldset" required error={Boolean(errors.primaryPosition)}>
        <FormLabel component="legend">Posição principal</FormLabel>
        <RadioGroup
          name="primaryPosition"
          value={values.primaryPosition}
          onChange={(e) => set("primaryPosition", e.target.value as Position)}
        >
          {POSITIONS.map((p) => (
            <FormControlLabel key={p} value={p} control={<Radio />} label={POSITION_LABELS[p]} />
          ))}
        </RadioGroup>
        {errors.primaryPosition && <FormHelperText>{errors.primaryPosition}</FormHelperText>}
      </FormControl>

      <FormControl component="fieldset">
        <FormLabel component="legend">Também jogo de… (opcional)</FormLabel>
        <FormHelperText sx={{ mx: 0 }}>Ajuda o sorteio a completar posições que estiverem faltando.</FormHelperText>
        <FormGroup>
          {POSITIONS.filter((p) => p !== values.primaryPosition).map((p) => (
            <FormControlLabel
              key={p}
              control={
                <Checkbox
                  name="secondaryPositions"
                  value={p}
                  checked={values.secondaryPositions.includes(p)}
                  onChange={(e) => toggleSecondary(p, e.target.checked)}
                />
              }
              label={POSITION_LABELS[p]}
            />
          ))}
        </FormGroup>
      </FormControl>

      <Button type="submit" variant="contained" size="large" disabled={pending} sx={{ alignSelf: "flex-start" }}>
        {pending ? "Salvando…" : "Salvar perfil"}
      </Button>
    </Stack>
  );
}
