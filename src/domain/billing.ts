// Regras financeiras (RF37–RF45, RN08–RN10).
// Valores SEMPRE em centavos inteiros (RNF24): R$ 12,50 = 1250.

import { toLocalParts } from "./dates";

export const BILLING_MODES = ["FIXED_MONTHLY", "SPLIT_PER_GAME"] as const;
export type BillingMode = (typeof BILLING_MODES)[number];

export const BILLING_MODE_LABELS: Record<BillingMode, { title: string; description: string }> = {
  FIXED_MONTHLY: {
    title: "Mensalidade fixa",
    description: "Mensalistas pagam um valor fixo por mês; diaristas pagam um valor por jogo.",
  },
  SPLIT_PER_GAME: {
    title: "Rateio por jogo",
    description: "O custo de cada jogo é dividido igualmente entre os confirmados.",
  },
};

export const CHARGE_STATUSES = ["PENDING", "REPORTED", "PAID", "WAIVED"] as const;
export type ChargeStatus = (typeof CHARGE_STATUSES)[number];

export const CHARGE_STATUS_LABELS: Record<ChargeStatus, string> = {
  PENDING: "Pendente",
  REPORTED: "Aguardando confirmação",
  PAID: "Pago",
  WAIVED: "Isento",
};

/**
 * RN08: divide um valor entre n pessoas sem perder centavos.
 * Os centavos que sobram vão, um a um, para as primeiras pessoas da lista.
 * Ex.: R$ 100,00 / 3 → [3334, 3333, 3333].
 */
export function splitCents(totalCents: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** RN09: mensalidade sugerida para cobrir o custo fixo, arredondada para cima ao real inteiro. */
export function suggestedMonthlyFee(monthlyCostCents: number, mensalistas: number): number | null {
  if (mensalistas <= 0 || monthlyCostCents <= 0) return null;
  return Math.ceil(monthlyCostCents / mensalistas / 100) * 100;
}

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 1250 → "R$ 12,50" */
export function formatMoney(cents: number) {
  return money.format(cents / 100).replace(/ /g, " ");
}

/** Aceita "12,50", "12.50", "R$ 1.234,56", "30" → centavos. Retorna null se inválido. */
export function parseMoney(input: string): number | null {
  const clean = input.replace(/R\$|\s/g, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(clean)) return null;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const value = Math.round(Number(normalized) * 100);
  return Number.isFinite(value) ? value : null;
}

/** Centavos → texto para preencher campo de formulário ("12,50"). */
export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Competência (mês de referência) no formato "2026-10". */
export function competenceOf(d: Date) {
  return toLocalParts(d).date.slice(0, 7);
}

const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

/** "2026-10" → "outubro de 2026" */
export function competenceLabel(competence: string) {
  const [y, m] = competence.split("-").map(Number);
  return monthFmt.format(new Date(Date.UTC(y, m - 1, 15)));
}

/** RF43: resumo do caixa. Só pagamentos confirmados entram no saldo (RN10). */
export function cashSummary(
  charges: { amountCents: number; status: ChargeStatus }[],
  expenses: { amountCents: number }[],
) {
  const sum = (xs: { amountCents: number }[]) => xs.reduce((s, x) => s + x.amountCents, 0);
  const received = sum(charges.filter((c) => c.status === "PAID"));
  const spent = sum(expenses);
  return {
    received,
    spent,
    balance: received - spent,
    pending: sum(charges.filter((c) => c.status === "PENDING" || c.status === "REPORTED")),
    awaitingConfirmation: charges.filter((c) => c.status === "REPORTED").length,
  };
}

type Payer = { membershipId: string; isMensalista: boolean; isKeeper: boolean };

/**
 * Cobranças de um jogo (RF39):
 *  - Mensalidade fixa: só diaristas pagam o valor avulso.
 *  - Rateio: o custo do jogo é dividido entre todos os confirmados pagantes.
 * Goleiros isentos (RF44) não pagam e não entram na divisão.
 */
export function gameCharges(input: {
  mode: BillingMode;
  payers: Payer[];
  dropInFeeCents: number;
  gameCostCents: number;
  keeperExempt: boolean;
}): { membershipId: string; amountCents: number }[] {
  const paying = input.payers.filter((p) => !(input.keeperExempt && p.isKeeper));

  if (input.mode === "FIXED_MONTHLY") {
    if (input.dropInFeeCents <= 0) return [];
    return paying.filter((p) => !p.isMensalista).map((p) => ({ membershipId: p.membershipId, amountCents: input.dropInFeeCents }));
  }

  const parts = splitCents(input.gameCostCents, paying.length);
  return paying.map((p, i) => ({ membershipId: p.membershipId, amountCents: parts[i] })).filter((c) => c.amountCents > 0);
}
