"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  BILLING_MODES,
  competenceLabel,
  formatMoney,
  gameCharges,
  parseMoney,
} from "@/domain/billing";
import { formatGameDate, fromLocalDateTime } from "@/domain/dates";
import { memberName, memberPositions } from "@/domain/members";
import { canManage } from "@/domain/roles";
import { type ActionResult, emptyToNull, fieldErrorsFrom, formValues } from "@/lib/forms";
import { logActivity } from "@/server/activity";
import { db } from "@/server/db";
import { requireGame } from "@/server/games";
import { guarded } from "@/server/guard";
import { ForbiddenError, requireManager, requireMember } from "@/server/patotas";

function refresh(patotaId: string) {
  revalidatePath(`/patotas/${patotaId}`, "layout");
  revalidatePath("/");
}

const moneyField = (label: string) =>
  z
    .string()
    .transform((v, ctx) => {
      if (v.trim() === "") return 0;
      const cents = parseMoney(v);
      if (cents === null || cents < 0) {
        ctx.addIssue({ code: "custom", message: `${label}: use um valor como 25,00.` });
        return z.NEVER;
      }
      return cents;
    });

const settingsSchema = z.object({
  billingMode: z.enum(BILLING_MODES),
  monthlyFeeCents: moneyField("Mensalidade"),
  dropInFeeCents: moneyField("Valor do diarista"),
  gameCostCents: moneyField("Custo do jogo"),
  monthlyCostCents: moneyField("Custo mensal"),
  pixKey: z.string().max(120, "Chave PIX muito longa.").nullable(),
  keeperExempt: z.boolean(),
});

/** RF37, RF42, RF44: configuração de cobrança da patota. */
export async function updateBillingSettings(patotaId: string, _prev: ActionResult, formData: FormData) {
  return guarded(async () => {
    await requireManager(patotaId);
    const parsed = settingsSchema.safeParse({
      billingMode: formData.get("billingMode"),
      monthlyFeeCents: String(formData.get("monthlyFeeCents") ?? ""),
      dropInFeeCents: String(formData.get("dropInFeeCents") ?? ""),
      gameCostCents: String(formData.get("gameCostCents") ?? ""),
      monthlyCostCents: String(formData.get("monthlyCostCents") ?? ""),
      pixKey: emptyToNull(formData.get("pixKey")),
      keeperExempt: formData.get("keeperExempt") === "on",
    });
    if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(formData) };

    await db.patota.update({ where: { id: patotaId }, data: parsed.data });
    refresh(patotaId);
    return { ok: true, message: "Configuração de cobrança salva." };
  });
}

/** RF39: gera as mensalidades do mês para os mensalistas. Pode ser repetido sem duplicar. */
export async function generateMonthlyCharges(patotaId: string, competence: string) {
  return guarded(async () => {
    const { patota } = await requireManager(patotaId);
    if (!/^\d{4}-\d{2}$/.test(competence)) return { error: "Mês inválido." };
    if (patota.monthlyFeeCents <= 0) return { error: "Defina o valor da mensalidade nos ajustes de cobrança." };

    const mensalistas = await db.membership.findMany({
      where: { patotaId, type: "MENSALISTA", status: "ACTIVE" },
      include: { user: true },
    });
    const result = await db.charge.createMany({
      data: mensalistas.map((m) => {
        const exempt = patota.keeperExempt && memberPositions(m).primary === "GOL";
        return {
          patotaId,
          membershipId: m.id,
          competence,
          description: `Mensalidade de ${competenceLabel(competence)}`,
          amountCents: patota.monthlyFeeCents,
          status: exempt ? ("WAIVED" as const) : ("PENDING" as const),
        };
      }),
      skipDuplicates: true,
    });

    refresh(patotaId);
    return {
      ok: true,
      message: result.count
        ? `${result.count} ${result.count === 1 ? "mensalidade" : "mensalidades"} de ${competenceLabel(competence)} ${result.count === 1 ? "gerada" : "geradas"}.`
        : `As mensalidades de ${competenceLabel(competence)} já tinham sido geradas.`,
    };
  });
}

/** RF39: cobranças de um jogo (avulso dos diaristas ou rateio do custo). */
export async function generateGameCharges(gameId: string) {
  return guarded(async () => {
    const { game } = await requireGame(gameId);
    const { patota } = await requireManager(game.patotaId);

    // Com resultado registrado (RF52), paga quem compareceu; antes disso, quem confirmou.
    const confirmed = await db.attendance.findMany({
      where: game.resultSavedAt ? { gameId, attended: true } : { gameId, status: "CONFIRMED" },
      include: { membership: { include: { user: true } } },
    });
    const charges = gameCharges({
      mode: patota.billingMode,
      dropInFeeCents: patota.dropInFeeCents,
      gameCostCents: patota.gameCostCents,
      keeperExempt: patota.keeperExempt,
      payers: confirmed.map(({ membership: m }) => ({
        membershipId: m.id,
        isMensalista: m.type === "MENSALISTA",
        isKeeper: memberPositions(m).primary === "GOL",
      })),
    });
    if (!charges.length) {
      return {
        error:
          patota.billingMode === "FIXED_MONTHLY"
            ? "Nenhuma cobrança: não há diaristas confirmados ou o valor do diarista é zero."
            : "Nenhuma cobrança: defina o custo do jogo nos ajustes de cobrança.",
      };
    }

    const label = patota.billingMode === "FIXED_MONTHLY" ? "Avulso" : "Rateio";
    const result = await db.charge.createMany({
      data: charges.map((c) => ({
        ...c,
        patotaId: patota.id,
        gameId,
        description: `${label} do jogo de ${formatGameDate(game.startsAt)}`,
      })),
      skipDuplicates: true,
    });

    refresh(patota.id);
    return {
      ok: true,
      message: result.count ? `${result.count} ${result.count === 1 ? "cobrança gerada" : "cobranças geradas"}.` : "As cobranças deste jogo já tinham sido geradas.",
    };
  });
}

/** Carrega a cobrança e garante que pertence a uma patota do usuário. */
async function loadCharge(chargeId: string) {
  const charge = await db.charge.findUnique({ where: { id: chargeId } });
  if (!charge) throw new ForbiddenError("Cobrança não encontrada.");
  const ctx = await requireMember(charge.patotaId);
  return { charge, ...ctx };
}

/** RF41: o próprio integrante avisa que pagou. */
export async function reportPayment(chargeId: string) {
  return guarded(async () => {
    const { charge, membership, user } = await loadCharge(chargeId);
    if (charge.membershipId !== membership.id) throw new ForbiddenError("Esta cobrança não é sua.");
    if (charge.status !== "PENDING") return { error: "Esta cobrança não está pendente." };

    await db.charge.update({ where: { id: chargeId }, data: { status: "REPORTED", reportedAt: new Date() } });
    await logActivity({
      patotaId: charge.patotaId,
      actorId: membership.id,
      message: `${memberName({ ...membership, user })} avisou que pagou: ${charge.description} (${formatMoney(charge.amountCents)})`,
      href: `/patotas/${charge.patotaId}/financeiro`,
      managersOnly: true,
      push: true,
    });
    refresh(charge.patotaId);
    return { ok: true, message: "Avisamos o organizador. O pagamento aparece como pago depois que ele confirmar." };
  });
}

const MANAGER_STATUSES = ["PENDING", "PAID", "WAIVED"] as const;

/** RF41, RN10: organizador confirma o pagamento, isenta ou reabre a cobrança. */
export async function setChargeStatus(chargeId: string, status: string) {
  return guarded(async () => {
    const { charge, membership } = await loadCharge(chargeId);
    if (!canManage(membership.role)) throw new ForbiddenError();
    const next = z.enum(MANAGER_STATUSES).parse(status);

    await db.charge.update({
      where: { id: chargeId },
      data: { status: next, paidAt: next === "PAID" ? new Date() : null, reportedAt: next === "PENDING" ? null : undefined },
    });
    if (next === "PAID" && charge.status !== "PAID") {
      const payer = await db.membership.findUnique({ where: { id: charge.membershipId }, include: { user: true } });
      await logActivity({
        patotaId: charge.patotaId,
        actorId: membership.id,
        message: `Pagamento confirmado: ${payer ? memberName(payer) : "integrante"} — ${charge.description} (${formatMoney(charge.amountCents)})`,
        href: `/patotas/${charge.patotaId}/financeiro`,
        managersOnly: true,
        push: true,
      });
    }
    refresh(charge.patotaId);
    const messages = { PAID: "Pagamento confirmado.", WAIVED: "Cobrança marcada como isenta.", PENDING: "Cobrança reaberta." };
    return { ok: true, message: messages[next] };
  });
}

export async function deleteCharge(chargeId: string) {
  return guarded(async () => {
    const { charge, membership } = await loadCharge(chargeId);
    if (!canManage(membership.role)) throw new ForbiddenError();
    await db.charge.delete({ where: { id: chargeId } });
    refresh(charge.patotaId);
    return { ok: true, message: "Cobrança excluída." };
  });
}

const expenseSchema = z.object({
  description: z.string().trim().min(2, "Descreva a despesa.").max(80, "Use no máximo 80 caracteres."),
  amountCents: moneyField("Valor").refine((v) => v > 0, "Informe o valor da despesa."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data."),
});

/** RF38: registra uma despesa (saída do caixa). */
export async function addExpense(patotaId: string, _prev: ActionResult, formData: FormData) {
  return guarded(async () => {
    await requireManager(patotaId);
    const parsed = expenseSchema.safeParse({
      description: formData.get("description") ?? "",
      amountCents: String(formData.get("amountCents") ?? ""),
      date: formData.get("date") ?? "",
    });
    if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(formData) };

    const { date, ...data } = parsed.data;
    await db.expense.create({ data: { ...data, patotaId, date: fromLocalDateTime(date, "12:00")! } });
    refresh(patotaId);
    return { ok: true, message: `Despesa de ${formatMoney(data.amountCents)} registrada.` };
  });
}

export async function deleteExpense(expenseId: string) {
  return guarded(async () => {
    const expense = await db.expense.findUnique({ where: { id: expenseId } });
    if (!expense) return { error: "Despesa não encontrada." };
    await requireManager(expense.patotaId);
    await db.expense.delete({ where: { id: expenseId } });
    refresh(expense.patotaId);
    return { ok: true, message: "Despesa excluída." };
  });
}
