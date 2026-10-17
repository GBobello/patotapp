import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PlaceIcon from "@mui/icons-material/Place";
import { PatotaTabs, type TabItem } from "@/components/patota-tabs";
import { MEMBER_TYPE_LABELS, ROLE_LABELS, canManage } from "@/domain/roles";
import { requireMember } from "@/server/patotas";

export default async function PatotaLayout({ children, params }: LayoutProps<"/patotas/[id]">) {
  const { id } = await params;
  const { patota, membership } = await requireMember(id);
  const base = `/patotas/${id}`;

  const tabs: TabItem[] = [
    { label: "Início", href: base },
    { label: "Integrantes", href: `${base}/membros` },
    { label: "Mural", href: `${base}/mural` },
    { label: "Financeiro", href: `${base}/financeiro` },
    { label: "Atividades", href: `${base}/atividades` },
  ];
  if (canManage(membership.role)) tabs.push({ label: "Ajustes", href: `${base}/configuracoes` });

  return (
    <Stack spacing={2}>
      <div>
        <Typography variant="h4" component="h1">
          {patota.name}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mt: 0.5, rowGap: 1 }}>
          {patota.location && (
            <Typography color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <PlaceIcon fontSize="small" aria-hidden /> {patota.location}
            </Typography>
          )}
          <Chip size="small" label={ROLE_LABELS[membership.role]} />
          <Chip size="small" variant="outlined" label={MEMBER_TYPE_LABELS[membership.type]} />
        </Stack>
      </div>
      <PatotaTabs items={tabs} />
      <div>{children}</div>
    </Stack>
  );
}
