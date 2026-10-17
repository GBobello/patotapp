import { describe, expect, it } from "vitest";
import { formatGameDate, fromLocalDateTime, nextOccurrence, relativeDay, toLocalParts } from "./dates";

describe("fromLocalDateTime / toLocalParts", () => {
  it("interpreta a data no horário de Brasília (UTC−3)", () => {
    const d = fromLocalDateTime("2026-10-22", "20:00")!;
    expect(d.toISOString()).toBe("2026-10-22T23:00:00.000Z");
    expect(toLocalParts(d)).toEqual({ date: "2026-10-22", time: "20:00", weekday: 4 });
  });

  it("rejeita formatos inválidos", () => {
    expect(fromLocalDateTime("22/10/2026", "20:00")).toBeNull();
    expect(fromLocalDateTime("2026-10-22", "8h")).toBeNull();
  });
});

describe("nextOccurrence", () => {
  // Sábado, 17/10/2026 às 13:00 em Brasília.
  const now = fromLocalDateTime("2026-10-17", "13:00")!;

  it("encontra a próxima quinta-feira", () => {
    const next = nextOccurrence(4, "20:00", now)!;
    expect(toLocalParts(next)).toMatchObject({ date: "2026-10-22", time: "20:00" });
  });

  it("usa hoje se o horário ainda não passou", () => {
    expect(toLocalParts(nextOccurrence(6, "18:00", now)!).date).toBe("2026-10-17");
  });

  it("pula para a próxima semana se o horário de hoje já passou", () => {
    expect(toLocalParts(nextOccurrence(6, "09:00", now)!).date).toBe("2026-10-24");
  });

  it("funciona quando o jogo é à noite e já é outro dia em UTC", () => {
    const lateNight = fromLocalDateTime("2026-10-22", "22:30")!; // 01:30 UTC de sexta
    expect(toLocalParts(nextOccurrence(4, "23:00", lateNight)!).date).toBe("2026-10-22");
  });
});

describe("formatação", () => {
  it("formata a data do jogo em português", () => {
    expect(formatGameDate(fromLocalDateTime("2026-10-22", "20:00")!)).toBe("qui., 22/10 às 20:00");
  });

  it("descreve dias relativos", () => {
    const now = fromLocalDateTime("2026-10-17", "13:00")!;
    expect(relativeDay(fromLocalDateTime("2026-10-17", "22:00")!, now)).toBe("hoje");
    expect(relativeDay(fromLocalDateTime("2026-10-18", "08:00")!, now)).toBe("amanhã");
    expect(relativeDay(fromLocalDateTime("2026-10-22", "20:00")!, now)).toBe("em 5 dias");
  });
});
