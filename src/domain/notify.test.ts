import { describe, expect, it } from "vitest";
import { buildPushPayload, isReminderDue, pushRecipients, reminderRecipients, type NotifyMember } from "./notify";

const members: NotifyMember[] = [
  { id: "m-org", userId: "u-org", role: "ORGANIZER" },
  { id: "m-co", userId: "u-co", role: "CO_ORGANIZER" },
  { id: "m-ana", userId: "u-ana", role: "PLAYER" },
  { id: "m-convidado", userId: null, role: "PLAYER" },
];

describe("pushRecipients (RF48)", () => {
  it("avisa todos com conta, menos quem fez a ação", () => {
    expect(pushRecipients(members, { audience: "ALL", actorId: "m-org" })).toEqual(["u-co", "u-ana"]);
  });
  it("sem autor (ex.: promoção automática) avisa todos com conta", () => {
    expect(pushRecipients(members, { audience: "ALL", actorId: null })).toEqual(["u-org", "u-co", "u-ana"]);
  });
  it("pagamentos só chegam aos organizadores", () => {
    expect(pushRecipients(members, { audience: "MANAGERS", actorId: "m-ana" })).toEqual(["u-org", "u-co"]);
    expect(pushRecipients(members, { audience: "MANAGERS", actorId: "m-co" })).toEqual(["u-org"]);
  });
  it("pode restringir a integrantes específicos sem furar o público", () => {
    expect(pushRecipients(members, { audience: "ALL", actorId: null }, ["m-ana"])).toEqual(["u-ana"]);
    expect(pushRecipients(members, { audience: "MANAGERS", actorId: null }, ["m-ana"])).toEqual([]);
  });
});

describe("buildPushPayload", () => {
  it("usa o nome da patota como título e o link interno da atividade", () => {
    const p = buildPushPayload({ id: "a1", message: "Novo jogo marcado", href: "/patotas/p1/jogos/g1" }, "Pelada de Quinta");
    expect(p).toEqual({ title: "Pelada de Quinta", body: "Novo jogo marcado", url: "/patotas/p1/jogos/g1", tag: "a1" });
  });
  it("ignora links externos e encurta mensagens longas", () => {
    const p = buildPushPayload({ id: "a1", message: "x".repeat(300), href: "//evil.example" }, "P");
    expect(p.url).toBe("/notificacoes");
    expect(p.body).toHaveLength(180);
  });
});

describe("isReminderDue", () => {
  const now = new Date("2026-10-20T12:00:00Z");
  const game = (hoursLeft: number, extra: Partial<{ status: string; reminderSentAt: Date | null }> = {}) => ({
    status: "SCHEDULED",
    reminderSentAt: null,
    confirmationDeadline: new Date(now.getTime() + hoursLeft * 3600_000),
    ...extra,
  });

  it("lembra quando o prazo fecha nas próximas 24 horas", () => {
    expect(isReminderDue(game(5), now)).toBe(true);
    expect(isReminderDue(game(24), now)).toBe(true);
  });
  it("não lembra cedo demais nem depois do prazo", () => {
    expect(isReminderDue(game(30), now)).toBe(false);
    expect(isReminderDue(game(-1), now)).toBe(false);
  });
  it("não repete o lembrete nem avisa de jogo cancelado", () => {
    expect(isReminderDue(game(5, { reminderSentAt: now }), now)).toBe(false);
    expect(isReminderDue(game(5, { status: "CANCELLED" }), now)).toBe(false);
  });
});

describe("reminderRecipients", () => {
  const deadline = new Date("2026-10-22T20:00:00Z");
  const people = [
    { id: "m1", type: "MENSALISTA" as const, user: { email: "a@x.com", emailReminders: true } },
    { id: "m2", type: "MENSALISTA" as const, user: { email: "b@x.com", emailReminders: true } },
    { id: "m3", type: "MENSALISTA" as const, user: { email: "c@x.com", emailReminders: true } },
    { id: "m4", type: "MENSALISTA" as const, user: { email: "d@x.com", emailReminders: false } },
    { id: "m5", type: "DIARISTA" as const, user: { email: "e@x.com", emailReminders: true } },
    { id: "m6", type: "MENSALISTA" as const, user: null },
  ];
  const attendances = [
    { membershipId: "m2", status: "CONFIRMED" },
    { membershipId: "m3", status: "MAYBE" },
  ];

  it("lembra quem não respondeu ou marcou talvez e respeita quem desligou", () => {
    expect(reminderRecipients(people, attendances, { confirmationDeadline: deadline, diaristasOpenAt: null })).toEqual([
      "a@x.com",
      "c@x.com",
      "e@x.com",
    ]);
  });
  it("não chama diaristas se a janela deles só abre depois do prazo", () => {
    const later = new Date(deadline.getTime() + 3600_000);
    expect(reminderRecipients(people, attendances, { confirmationDeadline: deadline, diaristasOpenAt: later })).toEqual([
      "a@x.com",
      "c@x.com",
    ]);
  });
});
