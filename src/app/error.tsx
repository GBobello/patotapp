"use client";

import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";

/** Erro inesperado: mensagem simples e opção de tentar de novo (Heurística 9). */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <Container component="main" maxWidth="xs" sx={{ py: 8 }}>
      <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }} role="alert">
        <ErrorOutlineIcon aria-hidden color="error" sx={{ fontSize: 56 }} />
        <Typography variant="h5" component="h1">
          Algo deu errado
        </Typography>
        <Typography color="text.secondary">Tente de novo. Se continuar, avise o organizador da patota.</Typography>
        <Button variant="contained" onClick={retry}>
          Tentar de novo
        </Button>
      </Stack>
    </Container>
  );
}
