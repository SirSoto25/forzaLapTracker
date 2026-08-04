import { beforeEach, expect, it, vi } from "vitest";

const { applyBackup, getDb, runSeedUpsert } = vi.hoisted(() => ({
  applyBackup: vi.fn(),
  getDb: vi.fn(),
  runSeedUpsert: vi.fn(),
}));

vi.mock("./applyBackup", () => ({
  applyBackup: (...args: unknown[]) => applyBackup(...args),
}));

vi.mock("../../db/client", () => ({
  getDb: (...args: unknown[]) => getDb(...args),
  runSeedUpsert: (...args: unknown[]) => runSeedUpsert(...args),
}));

beforeEach(() => {
  applyBackup.mockReset();
  getDb.mockReset();
  runSeedUpsert.mockReset();
});

it("returns parse error for invalid JSON without applying", async () => {
  const { importBackupText } = await import("./io");

  const result = await importBackupText("{not json", "merge");

  expect(result).toEqual({ error: "invalid_json" });
  expect(applyBackup).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
  expect(runSeedUpsert).not.toHaveBeenCalled();
});

it("returns schema error without applying", async () => {
  const { importBackupText } = await import("./io");

  const result = await importBackupText(
    JSON.stringify({
      format: "not-a-backup",
      schemaVersion: 1,
      exportedAt: "2026-08-04T12:00:00.000Z",
      appVersion: "0.1.0",
      data: {
        manufacturers: [],
        cars: [],
        circuits: [],
        laps: [],
        settings: [],
      },
    }),
    "replace",
  );

  expect(result).toEqual(
    expect.objectContaining({
      error: expect.stringMatching(/format/i),
    }),
  );
  expect(applyBackup).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
  expect(runSeedUpsert).not.toHaveBeenCalled();
});

it("applies valid backup and reseeds on replace", async () => {
  const db = { execute: vi.fn(), select: vi.fn() };
  getDb.mockResolvedValue(db);
  applyBackup.mockResolvedValue(undefined);
  runSeedUpsert.mockResolvedValue(undefined);

  const { importBackupText } = await import("./io");
  const { BACKUP_FORMAT } = await import("./schema");

  const result = await importBackupText(
    JSON.stringify({
      format: BACKUP_FORMAT,
      schemaVersion: 1,
      exportedAt: "2026-08-04T12:00:00.000Z",
      appVersion: "0.1.0",
      data: {
        manufacturers: [],
        cars: [],
        circuits: [],
        laps: [],
        settings: [],
      },
    }),
    "replace",
  );

  expect(result).toBe("imported");
  expect(applyBackup).toHaveBeenCalledOnce();
  expect(applyBackup).toHaveBeenCalledWith(db, expect.any(Object), "replace");
  expect(runSeedUpsert).toHaveBeenCalledOnce();
});

it("does not reseed on merge", async () => {
  const db = { execute: vi.fn(), select: vi.fn() };
  getDb.mockResolvedValue(db);
  applyBackup.mockResolvedValue(undefined);

  const { importBackupText } = await import("./io");
  const { BACKUP_FORMAT } = await import("./schema");

  const result = await importBackupText(
    JSON.stringify({
      format: BACKUP_FORMAT,
      schemaVersion: 1,
      exportedAt: "2026-08-04T12:00:00.000Z",
      appVersion: "0.1.0",
      data: {
        manufacturers: [],
        cars: [],
        circuits: [],
        laps: [],
        settings: [],
      },
    }),
    "merge",
  );

  expect(result).toBe("imported");
  expect(runSeedUpsert).not.toHaveBeenCalled();
});

it("maps apply failures to error objects", async () => {
  getDb.mockResolvedValue({ execute: vi.fn(), select: vi.fn() });
  applyBackup.mockRejectedValue(new Error("boom"));

  const { importBackupText } = await import("./io");
  const { BACKUP_FORMAT } = await import("./schema");

  const result = await importBackupText(
    JSON.stringify({
      format: BACKUP_FORMAT,
      schemaVersion: 1,
      exportedAt: "2026-08-04T12:00:00.000Z",
      appVersion: "0.1.0",
      data: {
        manufacturers: [],
        cars: [],
        circuits: [],
        laps: [],
        settings: [],
      },
    }),
    "merge",
  );

  expect(result).toEqual({ error: "boom" });
  expect(runSeedUpsert).not.toHaveBeenCalled();
});
