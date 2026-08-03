import { expect, it } from "vitest";
import { compareSemver, parseSemver } from "./semver";

it("parses v-prefixed and plain versions", () => {
  expect(parseSemver("v1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
  expect(parseSemver("0.1.0")).toEqual({ major: 0, minor: 1, patch: 0 });
});

it("rejects junk", () => {
  expect(parseSemver("nope")).toBeNull();
  expect(parseSemver("1.2")).toBeNull();
});

it("compares versions", () => {
  expect(compareSemver("0.1.0", "v0.1.1")).toBeLessThan(0);
  expect(compareSemver("v0.2.0", "0.1.9")).toBeGreaterThan(0);
  expect(compareSemver("1.0.0", "v1.0.0")).toBe(0);
});

it("treats unparsable as equal (no false update)", () => {
  expect(compareSemver("bad", "1.0.0")).toBe(0);
});
