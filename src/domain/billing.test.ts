import { describe, expect, it } from "vitest";
import {
  cashSummary,
  competenceLabel,
  formatMoney,
  gameCharges,
  parseMoney,
  splitCents,
  suggestedMonthlyFee,
} from "./billing";

describe("splitCents (RN08)", () => {
  it("divide sem perder centavos", () => {
    expect(splitCents(10000, 3)).toEqual([3334, 3333, 3333]);
    expect(splitCents(10000, 3).reduce((a, b) => a + b)).toBe(10000);
  });
  it("divisão exata", () => {
    expect(splitCents(28000, 14)).toEqual(Array(14).fill(2000));
  });
  it("sem pessoas, sem cobrança", () => {
    expect(splitCents(1000, 0)).toEqual([]);
  });
});

describe("suggestedMonthlyFee (RN09)", () => {
  it("arredonda para cima ao real inteiro", () => {
    // R$ 600 de aluguel para 14 mensalistas = R$ 42,857… → R$ 43
    expect(suggestedMonthlyFee(60000, 14)).toBe(4300);
  });
  it("sem mensalistas não há sugestão", () => {
    expect(suggestedMonthlyFee(60000, 0)).toBeNull();
  });
});

describe("dinheiro", () => {
  it("formata em reais", () => {
    expect(formatMoney(123456)).toBe("R$ 1.234,56");
  });
  it("entende os jeitos comuns de digitar", () => {
    expect(parseMoney("12,50")).toBe(1250);
    expect(parseMoney("12.50")).toBe(1250);
    expect(parseMoney("R$ 1.234,56")).toBe(123456);
    expect(parseMoney("30")).toBe(3000);
    expect(parseMoney("abc")).toBeNull();
    expect(parseMoney("12,345")).toBeNull();
  });
  it("nomeia o mês da competência", () => {
    expect(competenceLabel("2026-10")).toBe("outubro de 2026");
  });
});

describe("gameCharges (RF39, RF44)", () => {
  const payers = [
    { membershipId: "m1", isMensalista: true, isKeeper: false },
    { membershipId: "d1", isMensalista: false, isKeeper: false },
    { membershipId: "g1", isMensalista: false, isKeeper: true },
  ];

  it("mensalidade fixa: só diaristas pagam o avulso", () => {
    expect(
      gameCharges({ mode: "FIXED_MONTHLY", payers, dropInFeeCents: 2000, gameCostCents: 0, keeperExempt: false }),
    ).toEqual([
      { membershipId: "d1", amountCents: 2000 },
      { membershipId: "g1", amountCents: 2000 },
    ]);
  });

  it("rateio: divide entre todos os confirmados", () => {
    const charges = gameCharges({ mode: "SPLIT_PER_GAME", payers, dropInFeeCents: 0, gameCostCents: 10000, keeperExempt: false });
    expect(charges.map((c) => c.amountCents)).toEqual([3334, 3333, 3333]);
  });

  it("goleiro isento não paga e não entra na divisão", () => {
    const charges = gameCharges({ mode: "SPLIT_PER_GAME", payers, dropInFeeCents: 0, gameCostCents: 10000, keeperExempt: true });
    expect(charges).toEqual([
      { membershipId: "m1", amountCents: 5000 },
      { membershipId: "d1", amountCents: 5000 },
    ]);
  });
});

describe("cashSummary (RF43, RN10)", () => {
  it("só pagamentos confirmados entram no caixa", () => {
    const s = cashSummary(
      [
        { amountCents: 5000, status: "PAID" },
        { amountCents: 5000, status: "REPORTED" },
        { amountCents: 5000, status: "PENDING" },
        { amountCents: 5000, status: "WAIVED" },
      ],
      [{ amountCents: 3000 }],
    );
    expect(s).toEqual({ received: 5000, spent: 3000, balance: 2000, pending: 10000, awaitingConfirmation: 1 });
  });
});
