import { describe, expect, it } from "vitest";
import { piToClass } from "./piClass";

describe("piToClass", () => {
  it.each([
    [0, "D"],
    [400, "D"],
    [401, "C"],
    [500, "C"],
    [501, "B"],
    [600, "B"],
    [601, "A"],
    [700, "A"],
    [701, "S1"],
    [800, "S1"],
    [801, "S2"],
    [900, "S2"],
    [901, "R"],
    [998, "R"],
    [999, "X"],
  ] as const)("pi %i → %s", (pi, cls) => {
    expect(piToClass(pi)).toBe(cls);
  });

  it("rejects out of range", () => {
    expect(() => piToClass(-1)).toThrow();
    expect(() => piToClass(1000)).toThrow();
    expect(() => piToClass(1.5)).toThrow();
  });
});
