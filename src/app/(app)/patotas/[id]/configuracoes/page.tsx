import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ApprovalSwitch } from "@/components/approval-switch";
import { DrawRulesForm, TeamNamesForm } from "@/components/team-settings";
import { memberName } from "@/domain/members";
import { BillingSettingsForm } from "@/components/billing-settings-form";
import { DeletePatotaForm } from "@/components/delete-patota-form";
import { GameRulesForm } from "@/components/game-rules-form";
import { InviteCard } from "@/components/invite-card";
import { PatotaForm } from "@/components/patota-form";
import { canManage, isOrganizer } from "@/domain/roles";
import { db } from "@/server/db";
import { requireMember } from "@/server/patotas";
import { updateBillingSettings } from "../financeiro/actions";
import { deletePatota, updateGameRules, updatePatota } from "../actions";

export const metadata: Metadata = { title: "Ajustes da patota" };

export default async function PatotaSettingsPage({ params }: PageProps<"/patotas/[id]/configuracoes">) {
  const { id } = await params;
  const { patota, membership } = await requireMember(id);
  if (!canManage(membership.role)) notFound();
  const [mensalistas, members, rules] = await Promise.all([
    db.membership.count({ where: { patotaId: id, type: "MENSALISTA", status: "ACTIVE" } }),
    db.membership.findMany({ where: { patotaId: id, status: "ACTIVE" }, include: { user: true } }),
    db.drawRule.findMany({
      where: { patotaId: id },
      include: { first: { include: { user: true } }, second: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const memberOptions = members
    .map((m) => ({ id: m.id, name: memberName(m) }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Dados da patota
        </Typography>
        <PatotaForm
          action={updatePatota.bind(null, id)}
          submitLabel="Salvar"
          initial={{ name: patota.name, description: patota.description ?? "", location: patota.location ?? "" }}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Regras dos jogos
        </Typography>
        <GameRulesForm action={updateGameRules.bind(null, id)} diaristaWindowHours={patota.diaristaWindowHours}
          autoCreateGames={patota.autoCreateGames}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }} component="section" aria-labelledby="times-coletes">
        <Typography id="times-coletes" variant="h6" component="h2" gutterBottom>
          Nomes dos times (coletes)
        </Typography>
        <TeamNamesForm patotaId={id} initial={patota.teamNames} />
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }} component="section" aria-labelledby="regras-sorteio">
        <Typography id="regras-sorteio" variant="h6" component="h2" gutterBottom>
          Regras do sorteio
        </Typography>
        <DrawRulesForm
          patotaId={id}
          members={memberOptions}
          rules={rules.map((r) => ({ id: r.id, kind: r.kind, first: memberName(r.first), second: memberName(r.second) }))}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }} id="cobranca">
        <Typography variant="h6" component="h2" gutterBottom>
          Cobrança
        </Typography>
        <BillingSettingsForm action={updateBillingSettings.bind(null, id)} initial={{
            billingMode: patota.billingMode,
            monthlyFeeCents: patota.monthlyFeeCents,
            dropInFeeCents: patota.dropInFeeCents,
            gameCostCents: patota.gameCostCents,
            monthlyCostCents: patota.monthlyCostCents,
            pixKey: patota.pixKey,
            keeperExempt: patota.keeperExempt,
          }}
          mensalistas={mensalistas} />
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Entrada na patota
        </Typography>
        <ApprovalSwitch patotaId={id} initial={patota.requireApproval} />
      </Paper>

      <InviteCard patota={patota} />

      {isOrganizer(membership.role) && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderColor: "error.main" }}>
          <Typography variant="h6" component="h2" color="error" gutterBottom>
            Excluir patota
          </Typography>
          <DeletePatotaForm name={patota.name} action={deletePatota.bind(null, id)} />
        </Paper>
      )}
    </Stack>
  );
}
