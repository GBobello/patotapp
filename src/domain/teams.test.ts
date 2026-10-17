import { describe, expect, it } from "vitest";
import { moveMember, parseStoredDraw } from "./teams";

const draw = {
  teams: [
    { members: [{ membershipId: "a", role: "GOL" as const }, { membershipId: "b", role: null }] },
    { members: [{ membershipId: "c", role: "ATA" as const }] },
  ],
  warnings: [],
};

describe("teams", () => {
  it("move um jogador entre times mantendo a posição", () => {
    const moved = moveMember(draw, "b", 1);
    expect(moved.teams[0].members.map((m) => m.membershipId)).toEqual(["a"]);
    expect(moved.teams[1].members).toEqual([{ membershipId: "c", role: "ATA" }, { membershipId: "b", role: null }]);
  });

  it("recusa time inexistente ou jogador fora do sorteio", () => {
    expect(() => moveMember(draw, "b", 5)).toThrow();
    expect(() => moveMember(draw, "zzz", 0)).toThrow();
  });

  it("ignora JSON inválido", () => {
    expect(parseStoredDraw({ foo: 1 })).toBeNull();
    expect(parseStoredDraw(draw)).toEqual(draw);
  });
});
