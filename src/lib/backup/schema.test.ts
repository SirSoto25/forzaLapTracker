import { expect, it } from "vitest";
import { BACKUP_FORMAT, parseBackupJson } from "./schema";

function minimalBackup(overrides: Record<string, unknown> = {}) {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: 1,
    exportedAt: "2026-08-04T12:00:00.000Z",
    appVersion: "0.1.0",
    data: {
      manufacturers: [
        { name: "Ferrari", icon_path: "ferrari.png", is_builtin: 1 },
      ],
      cars: [
        {
          manufacturer_name: "Ferrari",
          model: "F40",
          is_builtin: 1,
          image_url: null,
        },
      ],
      circuits: [{ name: "Nürburgring", is_builtin: 1 }],
      laps: [
        {
          circuit_name: "Nürburgring",
          manufacturer_name: "Ferrari",
          car_model: "F40",
          pi: 800,
          class: "S1",
          time_ms: 123456,
          notes: null,
          recorded_at: "2026-08-04T12:00:00.000Z",
        },
      ],
      settings: [{ key: "theme", value: "dark" }],
    },
    ...overrides,
  };
}

it("parses a valid minimal fixture", () => {
  const result = parseBackupJson(JSON.stringify(minimalBackup()));
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.data.format).toBe(BACKUP_FORMAT);
    expect(result.data.schemaVersion).toBe(1);
    expect(result.data.data.laps).toHaveLength(1);
  }
});

it("rejects wrong format", () => {
  const result = parseBackupJson(
    JSON.stringify(minimalBackup({ format: "other-backup" })),
  );
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.message).toMatch(/format/i);
  }
});

it("rejects schemaVersion 2", () => {
  const result = parseBackupJson(
    JSON.stringify(minimalBackup({ schemaVersion: 2 })),
  );
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.message).toMatch(/schemaVersion/i);
  }
});

it("rejects PI 1000", () => {
  const backup = minimalBackup();
  (backup.data.laps[0] as { pi: number }).pi = 1000;
  const result = parseBackupJson(JSON.stringify(backup));
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.message).toMatch(/pi/i);
  }
});

it("rejects lap referencing missing circuit", () => {
  const backup = minimalBackup();
  (backup.data.laps[0] as { circuit_name: string }).circuit_name =
    "Missing Circuit";
  const result = parseBackupJson(JSON.stringify(backup));
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.message).toMatch(/unknown circuit/i);
  }
});

it("rejects car referencing missing manufacturer", () => {
  const backup = minimalBackup();
  (backup.data.cars[0] as { manufacturer_name: string }).manufacturer_name =
    "Missing Mfg";
  const result = parseBackupJson(JSON.stringify(backup));
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.message).toMatch(/unknown manufacturer/i);
  }
});

it("rejects invalid JSON", () => {
  const result = parseBackupJson("{not json");
  expect(result).toEqual({ ok: false, message: "invalid_json" });
});

it("rejects extra top-level keys", () => {
  const result = parseBackupJson(
    JSON.stringify(minimalBackup({ extra: true })),
  );
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.message.toLowerCase()).toMatch(/unrecognized|extra/i);
  }
});
