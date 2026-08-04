import { expect, it, vi } from "vitest";
import {
  applyBackup,
  executeApplyOps,
  lapDedupeKey,
  planMerge,
  planReplace,
  type ExistingSnapshot,
} from "./applyBackup";
import { BACKUP_FORMAT, type BackupFileV1 } from "./schema";

function sampleBackup(overrides?: Partial<BackupFileV1["data"]>): BackupFileV1 {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: 1,
    exportedAt: "2026-08-04T12:00:00.000Z",
    appVersion: "0.1.0",
    data: {
      manufacturers: [
        {
          name: "Custom Make",
          icon_path: "brands/custom.svg",
          is_builtin: 0,
        },
      ],
      cars: [
        {
          manufacturer_name: "Custom Make",
          model: "Special",
          is_builtin: 0,
          image_url: "https://example.com/special.webp",
        },
      ],
      circuits: [{ name: "My Track", is_builtin: 0 }],
      laps: [
        {
          circuit_name: "My Track",
          manufacturer_name: "Custom Make",
          car_model: "Special",
          pi: 700,
          class: "X", // wrong on purpose — plan must recompute via piToClass
          time_ms: 83456,
          notes: null,
          recorded_at: "2026-08-01T10:00:00.000Z",
        },
      ],
      settings: [{ key: "locale", value: "es" }],
      ...overrides,
    },
  };
}

it("planReplace deletes in FK-safe order then inserts with recomputed class", () => {
  const ops = planReplace(sampleBackup());

  expect(ops.slice(0, 5)).toEqual([
    { kind: "deleteAll", table: "lap" },
    { kind: "deleteAll", table: "car" },
    { kind: "deleteAll", table: "circuit" },
    { kind: "deleteAll", table: "manufacturer" },
    { kind: "deleteAll", table: "setting" },
  ]);

  expect(ops).toContainEqual({
    kind: "insertManufacturer",
    name: "Custom Make",
    icon_path: "brands/custom.svg",
    is_builtin: 0,
  });
  expect(ops).toContainEqual({
    kind: "insertCar",
    manufacturer_name: "Custom Make",
    model: "Special",
    is_builtin: 0,
    image_url: "https://example.com/special.webp",
  });
  expect(ops).toContainEqual({
    kind: "insertCircuit",
    name: "My Track",
    is_builtin: 0,
  });
  expect(ops).toContainEqual({
    kind: "insertLap",
    circuit_name: "My Track",
    manufacturer_name: "Custom Make",
    car_model: "Special",
    pi: 700,
    class: "A",
    time_ms: 83456,
    notes: null,
    recorded_at: "2026-08-01T10:00:00.000Z",
  });
  expect(ops).toContainEqual({
    kind: "upsertSetting",
    key: "locale",
    value: "es",
  });

  const deleteIdx = ops.findIndex(
    (o) => o.kind === "deleteAll" && o.table === "setting",
  );
  const firstInsert = ops.findIndex((o) => o.kind === "insertManufacturer");
  expect(firstInsert).toBeGreaterThan(deleteIdx);
});

it("planMerge upserts manufacturer by name and skips duplicate laps", () => {
  const backup = sampleBackup({
    manufacturers: [
      {
        name: "Ford",
        icon_path: "brands/ford-from-backup.svg",
        is_builtin: 1,
      },
      {
        name: "Custom Make",
        icon_path: "brands/custom-updated.svg",
        is_builtin: 0,
      },
    ],
    cars: [
      {
        manufacturer_name: "Custom Make",
        model: "Special",
        is_builtin: 0,
        image_url: null,
      },
      {
        manufacturer_name: "Ford",
        model: "GT",
        is_builtin: 1,
        image_url: null,
      },
    ],
    circuits: [
      { name: "My Track", is_builtin: 0 },
      { name: "New Track", is_builtin: 0 },
    ],
    laps: [
      {
        circuit_name: "My Track",
        manufacturer_name: "Custom Make",
        car_model: "Special",
        pi: 700,
        class: "A",
        time_ms: 83456,
        notes: "ignored for dedupe",
        recorded_at: "2026-08-01T10:00:00.000Z",
      },
      {
        circuit_name: "New Track",
        manufacturer_name: "Custom Make",
        car_model: "Special",
        pi: 700,
        class: "A",
        time_ms: 90000,
        notes: null,
        recorded_at: "2026-08-02T10:00:00.000Z",
      },
    ],
    settings: [
      { key: "locale", value: "en" },
      { key: "theme", value: "dark" },
    ],
  });

  const existing: ExistingSnapshot = {
    manufacturers: [
      {
        name: "Ford",
        icon_path: "brands/ford-local.svg",
        is_builtin: 1,
      },
      {
        name: "Custom Make",
        icon_path: "brands/custom-old.svg",
        is_builtin: 0,
      },
    ],
    cars: [
      {
        manufacturer_name: "Custom Make",
        model: "Special",
        is_builtin: 0,
        image_url: "https://example.com/old.webp",
      },
    ],
    circuits: [{ name: "My Track", is_builtin: 0 }],
    laps: [
      {
        circuit_name: "My Track",
        manufacturer_name: "Custom Make",
        car_model: "Special",
        pi: 700,
        time_ms: 83456,
        recorded_at: "2026-08-01T10:00:00.000Z",
      },
    ],
    settings: [{ key: "locale", value: "es" }],
  };

  const ops = planMerge(backup, existing);

  expect(ops).toContainEqual({
    kind: "upsertManufacturer",
    name: "Ford",
    icon_path: "brands/ford-local.svg",
    is_builtin: 1,
  });
  expect(ops).toContainEqual({
    kind: "upsertManufacturer",
    name: "Custom Make",
    icon_path: "brands/custom-updated.svg",
    is_builtin: 0,
  });

  expect(ops).toContainEqual({
    kind: "upsertCar",
    manufacturer_name: "Ford",
    model: "GT",
    is_builtin: 1,
    image_url: null,
  });
  expect(ops).toContainEqual({
    kind: "upsertCircuit",
    name: "New Track",
    is_builtin: 0,
  });

  const lapInserts = ops.filter((o) => o.kind === "insertLap");
  expect(lapInserts).toHaveLength(1);
  expect(lapInserts[0]).toEqual({
    kind: "insertLap",
    circuit_name: "New Track",
    manufacturer_name: "Custom Make",
    car_model: "Special",
    pi: 700,
    class: "A",
    time_ms: 90000,
    notes: null,
    recorded_at: "2026-08-02T10:00:00.000Z",
  });

  expect(ops).toContainEqual({
    kind: "upsertSetting",
    key: "locale",
    value: "en",
  });
  expect(ops).toContainEqual({
    kind: "upsertSetting",
    key: "theme",
    value: "dark",
  });

  expect(ops.some((o) => o.kind === "deleteAll")).toBe(false);
});

it("lapDedupeKey ignores notes", () => {
  expect(
    lapDedupeKey({
      circuit_name: "A",
      manufacturer_name: "B",
      car_model: "C",
      pi: 1,
      time_ms: 2,
      recorded_at: "t",
    }),
  ).toBe(["A", "B", "C", "1", "2", "t"].join("\u0000"));
});

it("applyBackup replace runs deletes then inserts inside a transaction", async () => {
  const execute = vi.fn().mockResolvedValue({ rowsAffected: 1, lastInsertId: 1 });
  const select = vi.fn();

  await applyBackup(
    { execute, select },
    sampleBackup(),
    "replace",
    executeApplyOps,
  );

  const sql = execute.mock.calls.map((c) => String(c[0]));
  expect(sql[0]).toBe("BEGIN IMMEDIATE");
  expect(sql.slice(1, 6)).toEqual([
    "DELETE FROM lap",
    "DELETE FROM car",
    "DELETE FROM circuit",
    "DELETE FROM manufacturer",
    "DELETE FROM setting",
  ]);
  expect(sql[sql.length - 1]).toBe("COMMIT");
  expect(select).not.toHaveBeenCalled();

  const lapCall = execute.mock.calls.find((c) =>
    String(c[0]).includes("INSERT INTO lap"),
  );
  expect(lapCall?.[1]).toEqual([
    700,
    "A",
    83456,
    null,
    "2026-08-01T10:00:00.000Z",
    "Custom Make",
    "Special",
    "My Track",
  ]);
});

it("executeApplyOps fails hard when a required insert affects 0 rows", async () => {
  const execute = vi.fn().mockImplementation(async (sql: string) => {
    if (String(sql).startsWith("BEGIN") || String(sql) === "COMMIT") {
      return { rowsAffected: 0 };
    }
    if (String(sql).includes("INSERT INTO manufacturer")) {
      return { rowsAffected: 0, lastInsertId: 0 };
    }
    return { rowsAffected: 1, lastInsertId: 1 };
  });

  await expect(
    executeApplyOps({ execute, select: vi.fn() }, [
      {
        kind: "insertManufacturer",
        name: "X",
        icon_path: "x.svg",
        is_builtin: 0,
      },
    ]),
  ).rejects.toThrow(/insertManufacturer affected 0 rows/);

  expect(execute.mock.calls.map((c) => String(c[0]))).toContain("ROLLBACK");
});
