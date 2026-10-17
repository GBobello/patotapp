import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { regenerateInviteCode } from "@/app/(app)/patotas/[id]/actions";
import { getOrigin } from "@/server/url";
import { ActionButton } from "./action-button";
import { CopyButton, WhatsAppButton } from "./share-buttons";

/** Link de convite com atalhos para copiar e compartilhar (RF09). Só para organizadores. */
export async function InviteCard({ patota }: { patota: { id: string; name: string; inviteCode: string } }) {
  const link = `${await getOrigin()}/convite/${patota.inviteCode}`;
  const message = `Bora jogar! Entre na patota *${patota.name}* no PatotApp: ${link}`;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Typography variant="h6" component="h2">
          Convide a galera
        </Typography>
        <Typography>
          Código: <strong style={{ letterSpacing: 2 }}>{patota.inviteCode}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
          {link}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <WhatsAppButton text={message} />
          <CopyButton text={link} label="Copiar link" successMessage="Link copiado!" />
          <ActionButton
            action={regenerateInviteCode.bind(null, patota.id)}
            confirm={{
              title: "Gerar novo link?",
              description: "O link atual vai parar de funcionar. Quem já entrou continua na patota.",
              confirmLabel: "Gerar novo link",
            }}
          >
            Gerar novo link
          </ActionButton>
        </Stack>
      </Stack>
    </Paper>
  );
}
