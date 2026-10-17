import { CHARGE_STATUS_LABELS } from "@/domain/billing";
import { memberName } from "@/domain/members";
import { canManage } from "@/domain/roles";
import { db } from "@/server/db";
import { requireMember } from "@/server/patotas";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

/** RF45: exporta cobranças e despesas em CSV (abre no Excel / Google Planilhas). */
export async function GET(_req: Request, { params }: RouteContext<"/patotas/[id]/financeiro/exportar">) {
  const { id } = await params;
  const { patota, membership } = await requireMember(id);
  if (!canManage(membership.role)) return new Response("Apenas organizadores.", { status: 403 });

  const [charges, expenses] = await Promise.all([
    db.charge.findMany({
      where: { patotaId: id },
      include: { membership: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.expense.findMany({ where: { patotaId: id }, orderBy: { date: "asc" } }),
  ]);

  const money = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
  const rows: string[][] = [
    ["Tipo", "Data", "Pessoa", "Descrição", "Valor (R$)", "Situação"],
    ...charges.map((c) => [
      "Cobrança",
      dateFmt.format(c.paidAt ?? c.createdAt),
      memberName(c.membership),
      c.description,
      money(c.amountCents),
      CHARGE_STATUS_LABELS[c.status],
    ]),
    ...expenses.map((e) => ["Despesa", dateFmt.format(e.date), "", e.description, `-${money(e.amountCents)}`, ""]),
  ];

  // Ponto e vírgula + BOM: o Excel em português abre com acentos e colunas corretas.
  const escape = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = "﻿" + rows.map((r) => r.map(escape).join(";")).join("\r\n");
  const filename = `financeiro-${patota.name.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase()}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
