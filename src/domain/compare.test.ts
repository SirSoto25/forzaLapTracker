import { expect, it } from "vitest";
import { bestDeltaMs } from "./compare";
it("delta", () => {
  expect(bestDeltaMs(80000, 81000)).toBe(-1000);
});
