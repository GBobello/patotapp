import { describe, expect, it } from "vitest";
import { checkCanRespond, initialStatus, promotions, type WaitlistEntry } from "./attendance";

const t = (min: number) => new Date(Date.UTC(2026, 9, 22, 20, min));

describe("checkCanRespond (RN03)", () => {
  const base = {
    status: "SCHEDULED" as const,
    startsAt: t(50),
    confirmationDeadline: t(30),
    isManager: false,
  };

  it("permite antes do prazo", () => {
    expect(checkCanRespond({ ...base, now: t(10) })).toBeNull();
  });
  it("bloqueia jogador depois do prazo", () => {
    expect(checkCanRespond({ ...base, now: t(40) })).toMatch(/prazo/);
  });
  it("organizador pode alterar depois do prazo", () => {
    expect(checkCanRespond({ ...base, now: t(40), isManager: true })).toBeNull();
  });
  it("bloqueia jogo cancelado mesmo para organizador", () => {
    expect(checkCanRespond({ ...base, status: "CANCELLED", now: t(0), isManager: true })).toMatch(/cancelado/);
  });
});

describe("initialStatus", () => {
  it("quem quer jogar entra no fim da fila", () => {
    expect(initialStatus("CONFIRMED", null)).toBe("WAITLIST");
    expect(initialStatus("CONFIRMED", "DECLINED")).toBe("WAITLIST");
  });
  it("quem já está confirmado continua confirmado", () => {
    expect(initialStatus("CONFIRMED", "CONFIRMED")).toBe("CONFIRMED");
  });
  it("talvez e não vou são gravados direto", () => {
    expect(initialStatus("MAYBE", "CONFIRMED")).toBe("MAYBE");
    expect(initialStatus("DECLINED", null)).toBe("DECLINED");
  });
});

describe("promotions (RF19, RF20)", () => {
  const waitlist: WaitlistEntry[] = [
    { membershipId: "diarista-cedo", isMensalista: false, since: t(1) },
    { membershipId: "mensalista-a", isMensalista: true, since: t(2) },
    { membershipId: "mensalista-b", isMensalista: true, since: t(3) },
  ];

  it("preenche as vagas livres por ordem de chegada", () => {
    expect(promotions({ maxPlayers: 10, confirmedCount: 8, waitlist, diaristasAllowed: true })).toEqual([
      "diarista-cedo",
      "mensalista-a",
    ]);
  });

  it("não promove ninguém quando está lotado", () => {
    expect(promotions({ maxPlayers: 10, confirmedCount: 10, waitlist, diaristasAllowed: true })).toEqual([]);
  });

  it("mensalistas têm prioridade enquanto as vagas não abrem para diaristas", () => {
    expect(promotions({ maxPlayers: 10, confirmedCount: 9, waitlist, diaristasAllowed: false })).toEqual([
      "mensalista-a",
    ]);
  });
});
