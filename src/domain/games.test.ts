import { describe, expect, it } from "vitest";
import { fromLocalDateTime, toLocalParts } from "./dates";
import { deadlineHoursOf, demotions, gameDeadlines, nextAutoGameDate } from "./games";

const at = (min: number) => new Date(Date.UTC(2026, 9, 22, 20, min));

describe("gameDeadlines", () => {
  const startsAt = fromLocalDateTime("2026-10-22", "20:00")!;

  it("calcula prazo e janela dos diaristas", () => {
    const d = gameDeadlines(startsAt, 3, 24);
    expect(toLocalParts(d.confirmationDeadline)).toMatchObject({ date: "2026-10-22", time: "17:00" });
    expect(toLocalParts(d.diaristasOpenAt!)).toMatchObject({ date: "2026-10-21", time: "20:00" });
  });

  it("sem janela, diaristas desde o início", () => {
    expect(gameDeadlines(startsAt, 3, null).diaristasOpenAt).toBeNull();
  });

  it("recupera as horas de antecedência", () => {
    const d = gameDeadlines(startsAt, 5, null);
    expect(deadlineHoursOf(startsAt, d.confirmationDeadline)).toBe(5);
  });
});

describe("demotions", () => {
  const confirmed = [
    { membershipId: "primeiro", since: at(1) },
    { membershipId: "ultimo", since: at(9) },
    { membershipId: "meio", since: at(5) },
  ];

  it("quem confirmou por último volta para a espera", () => {
    expect(demotions(confirmed, 2)).toEqual(["ultimo"]);
    expect(demotions(confirmed, 1)).toEqual(["ultimo", "meio"]);
  });

  it("ninguém sai se ainda cabe", () => {
    expect(demotions(confirmed, 3)).toEqual([]);
  });
});

describe("nextAutoGameDate (RF16)", () => {
  const now = fromLocalDateTime("2026-10-17", "13:00")!; // sábado
  const patota = { autoCreateGames: true, defaultWeekday: 4, defaultTime: "20:00" };

  it("cria a próxima quinta quando não há jogo marcado", () => {
    expect(toLocalParts(nextAutoGameDate(patota, false, now)!)).toMatchObject({ date: "2026-10-22", time: "20:00" });
  });

  it("não cria se já existe jogo, se está desligado ou sem padrão", () => {
    expect(nextAutoGameDate(patota, true, now)).toBeNull();
    expect(nextAutoGameDate({ ...patota, autoCreateGames: false }, false, now)).toBeNull();
    expect(nextAutoGameDate({ ...patota, defaultWeekday: null }, false, now)).toBeNull();
  });
});
