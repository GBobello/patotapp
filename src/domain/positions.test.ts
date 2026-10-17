import { describe, expect, it } from "vitest";
import { isPosition, normalizeSecondaryPositions } from "./positions";

describe("isPosition", () => {
  it("aceita apenas as siglas conhecidas", () => {
    expect(isPosition("GOL")).toBe(true);
    expect(isPosition("gol")).toBe(false);
    expect(isPosition("PNT")).toBe(false);
    expect(isPosition(undefined)).toBe(false);
  });
});

describe("normalizeSecondaryPositions", () => {
  it("remove a posição principal das secundárias", () => {
    expect(normalizeSecondaryPositions("ZAG", ["ZAG", "LAT"])).toEqual(["LAT"]);
  });

  it("remove duplicatas e ordena na ordem oficial", () => {
    expect(normalizeSecondaryPositions(null, ["ATA", "MEI", "ATA"])).toEqual(["MEI", "ATA"]);
  });
});
