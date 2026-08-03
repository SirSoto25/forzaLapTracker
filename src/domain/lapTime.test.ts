import { describe, expect, it } from "vitest";
import { formatLapTime, parseLapTime } from "./lapTime";

describe("lapTime", () => {
  it("parses mm:ss:mmm", () => {
    expect(parseLapTime("01:23:456")).toBe(83456);
    expect(parseLapTime("00:00:000")).toBe(0);
  });
  it("formats ms", () => {
    expect(formatLapTime(83456)).toBe("01:23:456");
    expect(formatLapTime(0)).toBe("00:00:000");
  });
  it("rejects garbage", () => {
    expect(() => parseLapTime("1:2:3")).toThrow();
    expect(() => parseLapTime("99:99:999")).toThrow();
  });
});
