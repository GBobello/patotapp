import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { LinkButton } from "@/components/links";

/** 404 em português e com saída clara (Heurística 9). */
export default function NotFound() {
  return (
    <Container component="main" maxWidth="xs" sx={{ py: 8 }}>
      <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
        <SearchOffIcon aria-hidden sx={{ fontSize: 56, color: "text.secondary" }} />
        <Typography variant="h5" component="h1">
          Página não encontrada
        </Typography>
        <Typography color="text.secondary">
          O link pode estar errado, ou você não participa desta patota.
        </Typography>
        <LinkButton href="/" variant="contained">
          Ir para o início
        </LinkButton>
      </Stack>
    </Container>
  );
}
