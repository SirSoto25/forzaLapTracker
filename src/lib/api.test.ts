import { beforeEach, expect, it, vi } from "vitest";

const { execute, select, invoke } = vi.hoisted(() => ({
  execute: vi.fn().mockResolvedValue({ rowsAffected: 1, lastInsertId: 7 }),
  select: vi.fn().mockResolvedValue([]),
  invoke: vi.fn(),
}));

vi.mock("../db/client", () => ({
  getDb: () => Promise.resolve({ execute, select }),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invoke(...args),
}));

beforeEach(() => {
  execute.mockClear();
  select.mockClear();
  invoke.mockReset();
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
    manufacturerId: 3,
    class: "S2",
    dateFrom: "2026-08-01",
    dateTo: "2026-08-02",
    sort: "date",
  });

  expect(select).toHaveBeenCalledWith(
    expect.stringMatching(
      /circuit_id = \$1.*car_id = \$2.*car\.manufacturer_id = \$3.*class = \$4.*date\(lap\.recorded_at\) >= \$5.*date\(lap\.recorded_at\) <= \$6.*recorded_at DESC/s,
    ),
    [1, 2, 3, "S2", "2026-08-01", "2026-08-02"],
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

it("updates and deletes catalog rows with lap guards", async () => {
  const {
    updateCircuit,
    deleteCircuit,
    updateCar,
    deleteCar,
    createManufacturer,
    updateManufacturer,
    deleteManufacturer,
  } = await import("./api");

  select.mockResolvedValueOnce([{ count: 0 }]);
  await updateCircuit(4, "Hokubu Circuit");
  await deleteCircuit(4);

  await updateCar(9, { model: "GR Yaris", manufacturerId: 2 });
  select.mockResolvedValueOnce([{ count: 0 }]);
  await deleteCar(9);

  expect(await createManufacturer("Custom Make")).toBe(7);
  await updateManufacturer(7, { name: "Custom Make Renamed" });
  select
    .mockResolvedValueOnce([{ count: 0 }])
    .mockResolvedValueOnce([{ cars: 0 }]);
  await deleteManufacturer(7);

  expect(execute).toHaveBeenCalledWith(
    "UPDATE circuit SET name = $1 WHERE id = $2",
    ["Hokubu Circuit", 4],
  );
  expect(execute).toHaveBeenCalledWith("DELETE FROM circuit WHERE id = $1", [
    4,
  ]);
  expect(execute).toHaveBeenCalledWith(
    "UPDATE car SET model = $1, manufacturer_id = $2 WHERE id = $3",
    ["GR Yaris", 2, 9],
  );
  expect(execute).toHaveBeenCalledWith("DELETE FROM car WHERE id = $1", [9]);
  expect(execute).toHaveBeenCalledWith(
    expect.stringContaining("INSERT INTO manufacturer"),
    ["Custom Make", "brands/placeholder.svg"],
  );
});

it("blocks deleting circuits that still have laps", async () => {
  const { deleteCircuit } = await import("./api");
  select.mockResolvedValueOnce([{ count: 2 }]);
  await expect(deleteCircuit(1)).rejects.toThrow(/laps/i);
  expect(execute).not.toHaveBeenCalled();
});

it("ensureCarImage downloads via Tauri and updates image_path", async () => {
  const { ensureCarImage } = await import("./api");
  select.mockResolvedValueOnce([
    {
      id: 1,
      manufacturer_id: 1,
      model: "911 GT3 RS",
      is_builtin: 1,
      image_path: null,
      image_url: "https://placehold.co/320x180/png",
      created_at: "2026-08-01",
    },
  ]);
  invoke.mockResolvedValueOnce("C:\\app\\images\\cars\\1.png");

  await expect(ensureCarImage(1)).resolves.toBe("C:\\app\\images\\cars\\1.png");
  expect(invoke).toHaveBeenCalledWith("ensure_car_image", {
    carId: 1,
    imageUrl: "https://placehold.co/320x180/png",
  });
  expect(execute).toHaveBeenCalledWith(
    "UPDATE car SET image_path = $1 WHERE id = $2",
    ["C:\\app\\images\\cars\\1.png", 1],
  );
});

it("ensureCarImage returns null on bad URL / invoke failure without throwing", async () => {
  const { ensureCarImage } = await import("./api");
  select.mockResolvedValueOnce([
    {
      id: 8,
      manufacturer_id: 5,
      model: "Mustang Dark Horse",
      is_builtin: 1,
      image_path: null,
      image_url: "https://placehold.co/not-a-real-image-404",
      created_at: "2026-08-01",
    },
  ]);
  invoke.mockResolvedValueOnce(null);

  await expect(ensureCarImage(8)).resolves.toBeNull();
  expect(execute).not.toHaveBeenCalled();

  select.mockResolvedValueOnce([
    {
      id: 8,
      manufacturer_id: 5,
      model: "Mustang Dark Horse",
      is_builtin: 1,
      image_path: null,
      image_url: "https://bad.example/missing.jpg",
      created_at: "2026-08-01",
    },
  ]);
  invoke.mockRejectedValueOnce(new Error("network"));

  await expect(ensureCarImage(8)).resolves.toBeNull();
});
