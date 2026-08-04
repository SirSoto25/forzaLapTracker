import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BACKUP_FORMAT, backupFileSchema } from "./schema";
import { buildBackupPayload } from "./buildBackup";

const FIXED_ISO = "2026-08-04T15:30:00.000Z";

const fixtures = {
  manufacturers: [
    {
      id: 1,
      name: "Custom Make",
      icon_path: "brands/placeholder.svg",
      is_builtin: 0,
    },
  ],
  cars: [
    {
      id: 10,
      manufacturer_id: 1,
      manufacturer_name: "Custom Make",
      model: "Special",
      is_builtin: 0,
      image_url: "https://example.com/special.webp",
      image_path: "C:\\Users\\local\\cache\\cars\\10.webp",
      created_at: "2026-08-01T00:00:00.000Z",
    },
  ],
  circuits: [
    {
      id: 2,
      name: "My Track",
      is_builtin: 0,
      created_at: "2026-08-01T00:00:00.000Z",
    },
  ],
  laps: [
    {
      id: 99,
      circuit_id: 2,
      car_id: 10,
      circuit_name: "My Track",
      manufacturer_name: "Custom Make",
      car_model: "Special",
      pi: 700,
      class: "A" as const,
      time_ms: 83456,
      notes: null,
      recorded_at: "2026-08-01T10:00:00.000Z",
    },
  ],
  settings: [{ key: "locale", value: "es" }],
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(FIXED_ISO));
});

afterEach(() => {
  vi.useRealTimers();
});

it("maps DB-shaped rows to BackupFileV1 with natural keys", () => {
  const backup = buildBackupPayload(fixtures, "0.1.0");

  expect(backup).toEqual({
    format: BACKUP_FORMAT,
    schemaVersion: 1,
    exportedAt: FIXED_ISO,
    appVersion: "0.1.0",
    data: {
      manufacturers: [
        {
          name: "Custom Make",
          icon_path: "brands/placeholder.svg",
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
          class: "A",
          time_ms: 83456,
          notes: null,
          recorded_at: "2026-08-01T10:00:00.000Z",
        },
      ],
      settings: [{ key: "locale", value: "es" }],
    },
  });
  expect(backupFileSchema.safeParse(backup).success).toBe(true);
});

it("omits image_path and sqlite ids from the payload", () => {
  const backup = buildBackupPayload(fixtures, "0.2.0");
  const json = JSON.stringify(backup);

  expect(json).not.toContain("image_path");
  expect(json).not.toContain("C:\\\\Users");
  expect(backup.data.cars[0]).not.toHaveProperty("image_path");
  expect(backup.data.cars[0]).not.toHaveProperty("id");
  expect(backup.data.manufacturers[0]).not.toHaveProperty("id");
  expect(backup.data.circuits[0]).not.toHaveProperty("id");
  expect(backup.data.laps[0]).not.toHaveProperty("id");
});
