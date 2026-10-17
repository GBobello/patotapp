import type { Metadata } from "next";
import { LinkButton } from "@/components/links";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";

export const metadata: Metadata = { title: "Confira seu e-mail" };

export default function VerifyRequestPage() {
  return (
    <Container component="main" maxWidth="xs" sx={{ py: { xs: 4, sm: 8 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={2} sx={{ textAlign: "center", alignItems: "center" }}>
          <MarkEmailReadIcon aria-hidden sx={{ fontSize: 48, color: "primary.main" }} />
          <Typography variant="h5" component="h1">
            Confira seu e-mail
          </Typography>
          <Typography>
            Enviamos um link de acesso. Abra o e-mail e toque em <strong>Entrar no PatotApp</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Não chegou? Olhe a caixa de spam ou peça outro link.
          </Typography>
          <LinkButton href="/login" variant="text">
            Usar outro e-mail
          </LinkButton>
        </Stack>
      </Paper>
    </Container>
  );
}
