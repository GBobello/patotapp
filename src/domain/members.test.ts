import { describe, expect, it } from "vitest";
import { average, effectiveRating, memberName } from "./members";

describe("effectiveRating (RF28)", () => {
  it("com poucos votos vale a nota do organizador", () => {
    expect(effectiveRating(3, [5, 5])).toBe(3);
  });
  it("com votos suficientes mistura organizador e galera", () => {
    expect(effectiveRating(3, [5, 5, 5])).toBe(4);
    expect(effectiveRating(4, [2, 3, 3, 4])).toBe(3.5);
  });
});

describe("helpers", () => {
  it("média com uma casa decimal", () => {
    expect(average([4, 5, 5])).toBe(4.7);
    expect(average([])).toBeNull();
  });
  it("nome de convidado e de usuário", () => {
    expect(memberName({ guestName: "Tio", guestPosition: null, user: null })).toBe("Tio");
    expect(
      memberName({
        guestName: null,
        guestPosition: null,
        user: { nickname: null, name: null, email: "ze@x.com", image: null, primaryPosition: null, secondaryPositions: [] },
      }),
    ).toBe("ze");
  });
});
