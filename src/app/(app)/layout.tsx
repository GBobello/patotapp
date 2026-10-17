import { LinkBox } from "@/components/links";
import AppBar from "@mui/material/AppBar";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import { AccountMenu } from "@/components/account-menu";
import { requireUser } from "@/server/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const displayName = user.nickname ?? user.name ?? user.email;

  return (
    <>
      {/* Atalho para pular a navegação (WCAG 2.4.1) — aparece ao receber foco pelo teclado. */}
      <Link
        href="#conteudo"
        sx={{
          position: "absolute",
          left: 8,
          top: -64,
          zIndex: "tooltip",
          p: 1.5,
          bgcolor: "background.paper",
          borderRadius: 1,
          "&:focus": { top: 8 },
        }}
      >
        Pular para o conteúdo
      </Link>

      <AppBar position="sticky" color="primary" elevation={0}>
        <Toolbar>
          <LinkBox
            href="/"
            sx={{ display: "flex", alignItems: "center", gap: 1, color: "inherit", textDecoration: "none", flexGrow: 1 }}
          >
            <SportsSoccerIcon aria-hidden />
            <Typography variant="h6" component="span">
              PatotApp
            </Typography>
          </LinkBox>
          <AccountMenu displayName={displayName} image={user.image} />
        </Toolbar>
      </AppBar>

      <Container component="main" id="conteudo" tabIndex={-1} maxWidth="md" sx={{ py: 3, outline: "none" }}>
        {children}
      </Container>
    </>
  );
}
