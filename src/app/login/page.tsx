import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import { auth, googleEnabled } from "@/auth";
import { safeCallbackPath } from "@/lib/forms";
import { TextLink } from "@/components/links";
import { loginWithGoogle } from "./actions";
import { EmailLoginForm } from "./email-login-form";

export const metadata: Metadata = { title: "Entrar" };

// Códigos de erro do Auth.js traduzidos para mensagens que ajudam a resolver (Heurística 9).
const ERROR_MESSAGES: Record<string, string> = {
  Verification: "Este link já foi usado ou expirou. Peça um novo link abaixo.",
  OAuthAccountNotLinked: "Este e-mail já entrou de outra forma. Use o mesmo método da primeira vez.",
  AccessDenied: "Acesso negado. Tente novamente.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, callbackUrl: rawCallback, conta } = await searchParams;
  const callbackUrl = safeCallbackPath(rawCallback);
  if ((await auth())?.user) redirect(callbackUrl);

  const errorMessage =
    typeof error === "string" ? (ERROR_MESSAGES[error] ?? "Não foi possível entrar. Tente novamente.") : null;

  return (
    <Container component="main" maxWidth="xs" sx={{ py: { xs: 4, sm: 8 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={3}>
          <Box sx={{ textAlign: "center" }}>
            <SportsSoccerIcon aria-hidden sx={{ fontSize: 48, color: "primary.main" }} />
            <Typography variant="h4" component="h1">
              PatotApp
            </Typography>
            <Typography color="text.secondary">Organize sua patota sem complicação.</Typography>
          </Box>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          {conta === "excluida" && <Alert severity="success">Sua conta e seus dados foram excluídos.</Alert>}

          <EmailLoginForm callbackUrl={callbackUrl} />

          {googleEnabled && (
            <>
              <Divider>ou</Divider>
              <form action={loginWithGoogle}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <Button type="submit" variant="outlined" size="large" fullWidth>
                  Entrar com Google
                </Button>
              </form>
            </>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            Você continua conectado por 30 dias neste aparelho.
          </Typography>
          <Typography variant="body2" sx={{ textAlign: "center" }}>
            <TextLink href="/privacidade">Política de privacidade</TextLink>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
