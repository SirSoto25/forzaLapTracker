import { beforeEach, expect, it, vi } from "vitest";

const { applyBackup, getDb, runSeedUpsert, closeDb, open, readTextFile } =
  vi.hoisted(() => ({
    applyBackup: vi.fn(),
    getDb: vi.fn(),
    runSeedUpsert: vi.fn(),
    closeDb: vi.fn(),
    open: vi.fn(),
    readTextFile: vi.fn(),
  }));

vi.mock("./applyBackup", () => ({
  applyBackup: (...args: unknown[]) => applyBackup(...args),
  applyBackupOpsNative: vi.fn(),
}));

vi.mock("../../db/client", () => ({
  getDb: (...args: unknown[]) => getDb(...args),
  runSeedUpsert: (...args: unknown[]) => runSeedUpsert(...args),
  closeDb: (...args: unknown[]) => closeDb(...args),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: (...args: unknown[]) => open(...args),
  save: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: (...args: unknown[]) => readTextFile(...args),
  writeTextFile: vi.fn(),
}));

vi.mock("@tauri-apps/api/app", () => ({
  getVersion: vi.fn().mockResolvedValue("0.1.0"),
}));

beforeEach(() => {
  applyBackup.mockReset();
  getDb.mockReset();
  runSeedUpsert.mockReset();
  closeDb.mockReset();
  open.mockReset();
  readTextFile.mockReset();
});

function validBackupJson() {
  return JSON.stringify({
    format: "forza-lap-tracker-backup",
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
  });
}

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
  expect(applyBackup).toHaveBeenCalledWith(
    db,
    expect.any(Object),
    "replace",
    expect.any(Function),
  );
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

it("openBackupForImport returns cancelled when dialog is dismissed", async () => {
  open.mockResolvedValue(null);
  const { openBackupForImport } = await import("./io");
  await expect(openBackupForImport()).resolves.toBe("cancelled");
  expect(readTextFile).not.toHaveBeenCalled();
});

it("openBackupForImport validates file before returning backup", async () => {
  open.mockResolvedValue("C:\\backup.fltbackup.json");
  readTextFile.mockResolvedValue(validBackupJson());
  const { openBackupForImport } = await import("./io");
  const { BACKUP_FORMAT } = await import("./schema");

  const result = await openBackupForImport();
  expect(result).toEqual({
    backup: expect.objectContaining({ format: BACKUP_FORMAT }),
  });
  expect(applyBackup).not.toHaveBeenCalled();
});

it("openBackupForImport returns error for invalid JSON", async () => {
  open.mockResolvedValue("C:\\bad.json");
  readTextFile.mockResolvedValue("{nope");
  const { openBackupForImport } = await import("./io");

  await expect(openBackupForImport()).resolves.toEqual({
    error: "invalid_json",
  });
  expect(applyBackup).not.toHaveBeenCalled();
});
