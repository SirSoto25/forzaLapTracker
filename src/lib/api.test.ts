import { beforeEach, expect, it, vi } from "vitest";

const { execute, select } = vi.hoisted(() => ({
  execute: vi.fn().mockResolvedValue({ rowsAffected: 1, lastInsertId: 7 }),
  select: vi.fn().mockResolvedValue([]),
}));

vi.mock("../db/client", () => ({
  getDb: () => Promise.resolve({ execute, select }),
}));

beforeEach(() => {
  execute.mockClear();
  select.mockClear();
});

it("stores the class computed from PI", async () => {
  const { insertLap } = await import("./api");

  expect(
    await insertLap({
      circuitId: 1,
      carId: 2,
      pi: 845,
      timeMs: 83_456,
      notes: "clean",
    }),
  ).toBe(7);
  expect(execute).toHaveBeenCalledWith(
    expect.stringContaining("INSERT INTO lap"),
    [1, 2, 845, "S2", 83_456, "clean"],
  );
});

it("builds lap filters with bound parameters", async () => {
  const { listLaps } = await import("./api");

  await listLaps({
    circuitId: 1,
    carId: 2,
    class: "S2",
    dateFrom: "2026-08-01",
    dateTo: "2026-08-02",
    sort: "date",
  });

  expect(select).toHaveBeenCalledWith(
    expect.stringMatching(
      /circuit_id = \$1.*car_id = \$2.*class = \$3.*date\(lap\.recorded_at\) >= \$4.*date\(lap\.recorded_at\) <= \$5.*recorded_at DESC/s,
    ),
    [1, 2, "S2", "2026-08-01", "2026-08-02"],
  );
});

it("creates custom catalog rows and upserts settings", async () => {
  const { createCar, createCircuit, setSetting } = await import("./api");

  expect(await createCircuit("Custom")).toBe(7);
  expect(await createCar(3, "Special")).toBe(7);
  await setSetting("locale", "es");

  expect(execute.mock.calls).toEqual([
    [expect.stringContaining("INSERT INTO circuit"), ["Custom"]],
    [expect.stringContaining("INSERT INTO car"), [3, "Special", null, null]],
    [expect.stringContaining("ON CONFLICT(key)"), ["locale", "es"]],
  ]);
});
