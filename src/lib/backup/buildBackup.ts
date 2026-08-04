import type { CarClass } from "../../domain/piClass";
import {
  BACKUP_FORMAT,
  backupFileSchema,
  type BackupFileV1,
} from "./schema";

export type BackupManufacturerRow = {
  name: string;
  icon_path: string;
  is_builtin: 0 | 1 | number;
};

export type BackupCarRow = {
  manufacturer_name: string;
  model: string;
  is_builtin: 0 | 1 | number;
  image_url: string | null;
  /** Local cache path — never exported. */
  image_path?: string | null;
};

export type BackupCircuitRow = {
  name: string;
  is_builtin: 0 | 1 | number;
};

export type BackupLapRow = {
  circuit_name: string;
  manufacturer_name: string;
  car_model: string;
  pi: number;
  class: CarClass;
  time_ms: number;
  notes: string | null;
  recorded_at: string;
};

export type BackupSettingRow = {
  key: string;
  value: string;
};

export type BackupSourceRows = {
  manufacturers: BackupManufacturerRow[];
  cars: BackupCarRow[];
  circuits: BackupCircuitRow[];
  laps: BackupLapRow[];
  settings: BackupSettingRow[];
};

function asBuiltin(value: number): 0 | 1 {
  return value === 1 ? 1 : 0;
}

/** Map DB-shaped row fixtures into a validated portable backup payload. */
export function buildBackupPayload(
  rows: BackupSourceRows,
  appVersion: string,
): BackupFileV1 {
  const payload = {
    format: BACKUP_FORMAT,
    schemaVersion: 1 as const,
    exportedAt: new Date().toISOString(),
    appVersion,
    data: {
      manufacturers: rows.manufacturers.map((m) => ({
        name: m.name,
        icon_path: m.icon_path,
        is_builtin: asBuiltin(m.is_builtin),
      })),
      cars: rows.cars.map((c) => ({
        manufacturer_name: c.manufacturer_name,
        model: c.model,
        is_builtin: asBuiltin(c.is_builtin),
        image_url: c.image_url,
      })),
      circuits: rows.circuits.map((c) => ({
        name: c.name,
        is_builtin: asBuiltin(c.is_builtin),
      })),
      laps: rows.laps.map((l) => ({
        circuit_name: l.circuit_name,
        manufacturer_name: l.manufacturer_name,
        car_model: l.car_model,
        pi: l.pi,
        class: l.class,
        time_ms: l.time_ms,
        notes: l.notes,
        recorded_at: l.recorded_at,
      })),
      settings: rows.settings.map((s) => ({
        key: s.key,
        value: s.value,
      })),
    },
  };

  return backupFileSchema.parse(payload);
}
