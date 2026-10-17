import type { Metadata } from "next";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { ActionButton } from "@/components/action-button";
import { ChargesList, type ChargeRow } from "@/components/charges-list";
import { ExpenseForm, MonthlyChargesControl } from "@/components/finance-controls";
import { LinkButton } from "@/components/links";
import { CopyButton } from "@/components/share-buttons";
import { BILLING_MODE_LABELS, cashSummary, competenceOf, formatMoney } from "@/domain/billing";
import { toLocalParts } from "@/domain/dates";
import { memberName } from "@/domain/members";
import { canManage } from "@/domain/roles";
import { db } from "@/server/db";
import { requireMember } from "@/server/patotas";
import { deleteExpense } from "./actions";

export const metadata: Metadata = { title: "Financeiro" };

const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });

function addMonths(competence: string, delta: number) {
  const [y, m] = competence.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export default async function FinancePage({ params }: PageProps<"/patotas/[id]/financeiro">) {
  const { id } = await params;
  const { patota, membership: me } = await requireMember(id);
  const manager = canManage(me.role);

  const [charges, expenses] = await Promise.all([
    db.charge.findMany({
      // RF27/LGPD: jogador vê só as próprias cobranças.
      where: manager ? { patotaId: id } : { patotaId: id, membershipId: me.id },
      include: { membership: { include: { user: true } } },
      orderBy: [{ createdAt: "desc" }],
    }),
    manager ? db.expense.findMany({ where: { patotaId: id }, orderBy: { date: "desc" } }) : Promise.resolve([]),
  ]);

  const rows: ChargeRow[] = charges.map((c) => ({
    id: c.id,
    memberName: memberName(c.membership),
    description: c.description,
    amountCents: c.amountCents,
    status: c.status,
    isMine: c.membershipId === me.id,
  }));
  const mine = rows.filter((r) => r.isMine);
  const myOpen = mine.filter((r) => r.status === "PENDING" || r.status === "REPORTED");
  const summary = cashSummary(charges, expenses);
  const debtors = new Set(charges.filter((c) => c.status === "PENDING").map((c) => c.membershipId)).size;

  const now = new Date();
  const current = competenceOf(now);
  const months = [addMonths(current, -1), current, addMonths(current, 1)];

  return (
    <Stack spacing={3}>
      {patota.pixKey && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
            <div style={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" component="h2">
                Chave PIX da patota
              </Typography>
              <Typography sx={{ wordBreak: "break-all", fontWeight: 600 }}>{patota.pixKey}</Typography>
            </div>
            <CopyButton text={patota.pixKey} label="Copiar chave PIX" successMessage="Chave PIX copiada!" />
          </Stack>
        </Paper>
      )}

      <section aria-labelledby="meus-pagamentos">
        <Typography id="meus-pagamentos" variant="h6" component="h2" gutterBottom>
          Meus pagamentos
        </Typography>
        {mine.length === 0 ? (
          <Typography color="text.secondary">Você não tem cobranças nesta patota.</Typography>
        ) : (
          <>
            {myOpen.length > 0 && (
              <Alert severity="warning" sx={{ mb: 1.5 }}>
                Você tem {myOpen.length} {myOpen.length === 1 ? "cobrança em aberto" : "cobranças em aberto"}, total de{" "}
                {formatMoney(myOpen.reduce((s, r) => s + r.amountCents, 0))}. Pague pelo PIX e toque em “Já paguei”.
              </Alert>
            )}
            <ChargesList charges={mine} manager={false} showMember={false} />
          </>
        )}
      </section>

      {manager && (
        <>
          <section aria-labelledby="caixa">
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1 }}>
              <Typography id="caixa" variant="h6" component="h2">
                Caixa da patota
              </Typography>
              <Button href={`/patotas/${id}/financeiro/exportar`} startIcon={<DownloadIcon />} download>
                Exportar planilha (CSV)
              </Button>
            </Stack>
            <Grid container spacing={1.5}>
              {[
                { label: "Saldo", value: summary.balance, strong: true },
                { label: "Recebido", value: summary.received },
                { label: "Despesas", value: summary.spent },
                { label: "A receber", value: summary.pending },
              ].map((s) => (
                <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {s.label}
                      </Typography>
                      <Typography
                        variant={s.strong ? "h5" : "h6"}
                        component="p"
                        color={s.strong && s.value < 0 ? "error" : undefined}
                      >
                        {formatMoney(s.value)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {debtors} {debtors === 1 ? "pessoa com pagamento pendente" : "pessoas com pagamento pendente"}
              {summary.awaitingConfirmation > 0 && ` · ${summary.awaitingConfirmation} pagamentos para confirmar`}
              {" · "}Modelo: {BILLING_MODE_LABELS[patota.billingMode].title}{" "}
              (<LinkButton href={`/patotas/${id}/configuracoes#cobranca`} size="small" sx={{ minHeight: 0, p: 0 }}>
                alterar
              </LinkButton>)
            </Typography>
          </section>

          {patota.billingMode === "FIXED_MONTHLY" && (
            <Paper variant="outlined" sx={{ p: 2 }} component="section" aria-labelledby="mensalidades">
              <Typography id="mensalidades" variant="subtitle1" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                Mensalidades ({formatMoney(patota.monthlyFeeCents)} por mensalista)
              </Typography>
              <MonthlyChargesControl patotaId={id} months={months} />
            </Paper>
          )}
          {patota.billingMode === "SPLIT_PER_GAME" && (
            <Alert severity="info">
              No rateio, gere as cobranças na página de cada jogo, depois que a lista fechar.
            </Alert>
          )}

          <section aria-labelledby="cobrancas">
            <Typography id="cobrancas" variant="h6" component="h2" gutterBottom>
              Cobranças da patota
            </Typography>
            <ChargesList charges={rows} manager showMember />
          </section>

          <section aria-labelledby="despesas">
            <Typography id="despesas" variant="h6" component="h2" gutterBottom>
              Despesas
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 1.5 }}>
              <ExpenseForm patotaId={id} today={toLocalParts(now).date} />
            </Paper>
            {expenses.length > 0 && (
              <Paper variant="outlined">
                <List>
                  {expenses.map((e) => (
                    <ListItem
                      key={e.id}
                      secondaryAction={
                        <ActionButton
                          action={deleteExpense.bind(null, e.id)}
                          aria-label={`Excluir despesa ${e.description}`}
                          color="error"
                          sx={{ minWidth: 48 }}
                          confirm={{
                            title: "Excluir despesa?",
                            description: `${e.description} — ${formatMoney(e.amountCents)}`,
                            confirmLabel: "Excluir",
                            destructive: true,
                          }}
                        >
                          <DeleteIcon />
                        </ActionButton>
                      }
                    >
                      <ListItemText primary={e.description} secondary={dateFmt.format(e.date)} />
                      <Typography sx={{ fontWeight: 600, mr: 6 }}>{formatMoney(e.amountCents)}</Typography>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </section>
        </>
      )}
    </Stack>
  );
}
