import { describe, expect, it } from "vitest";
import { canManage, checkOrganizerRemains, extractInviteCode, generateInviteCode } from "./roles";

describe("canManage", () => {
  it("permite organizador e co-organizador", () => {
    expect(canManage("ORGANIZER")).toBe(true);
    expect(canManage("CO_ORGANIZER")).toBe(true);
    expect(canManage("PLAYER")).toBe(false);
  });
});

describe("checkOrganizerRemains (RN02)", () => {
  it("bloqueia o último organizador de sair", () => {
    expect(checkOrganizerRemains("ORGANIZER", null, 1)).not.toBeNull();
  });
  it("bloqueia rebaixar o último organizador", () => {
    expect(checkOrganizerRemains("ORGANIZER", "PLAYER", 1)).not.toBeNull();
  });
  it("permite quando há outro organizador", () => {
    expect(checkOrganizerRemains("ORGANIZER", null, 2)).toBeNull();
  });
  it("não se aplica a jogadores", () => {
    expect(checkOrganizerRemains("PLAYER", null, 1)).toBeNull();
  });
});

describe("convites", () => {
  it("gera códigos com o tamanho pedido e sem caracteres ambíguos", () => {
    const code = generateInviteCode(8);
    expect(code).toHaveLength(8);
    expect(code).not.toMatch(/[01OIL]/);
  });

  it("extrai o código de um link colado", () => {
    expect(extractInviteCode("https://patotapp.app/convite/ABCD2345")).toBe("ABCD2345");
    expect(extractInviteCode("  abcd2345 ")).toBe("ABCD2345");
    expect(extractInviteCode("???")).toBeNull();
  });
});
