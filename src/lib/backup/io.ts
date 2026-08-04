import { getVersion } from "@tauri-apps/api/app";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { closeDb, getDb, runSeedUpsert } from "../../db/client";
import type { CarClass } from "../../domain/piClass";
import {
  applyBackup,
  applyBackupOpsNative,
  type ApplyMode,
} from "./applyBackup";
import {
  buildBackupPayload,
  type BackupSourceRows,
} from "./buildBackup";
import { parseBackupJson, type BackupFileV1 } from "./schema";

const BACKUP_FILTERS = [
  {
    name: "Forza Lap Tracker Backup",
    extensions: ["fltbackup.json", "json"],
  },
];

type QueryDb = {
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
};

export type ExportBackupResult = "saved" | "cancelled";
export type ImportBackupResult =
  | "imported"
  | "cancelled"
  | { error: string };

export type OpenBackupResult =
  | "cancelled"
  | { error: string }
  | { backup: BackupFileV1 };

/** Load portable backup rows from the live DB (joins natural keys). */
export async function selectBackupSourceRows(
  db: QueryDb,
): Promise<BackupSourceRows> {
  const [manufacturers, cars, circuits, laps, settings] = await Promise.all([
    db.select<BackupSourceRows["manufacturers"]>(
      `SELECT name, icon_path, is_builtin FROM manufacturer ORDER BY name`,
    ),
    db.select<BackupSourceRows["cars"]>(
      `SELECT manufacturer.name AS manufacturer_name, car.model, car.is_builtin,
        car.image_url
      FROM car
      JOIN manufacturer ON manufacturer.id = car.manufacturer_id
      ORDER BY manufacturer.name, car.model`,
    ),
    db.select<BackupSourceRows["circuits"]>(
      `SELECT name, is_builtin FROM circuit ORDER BY name`,
    ),
    db.select<
      Array<{
        circuit_name: string;
        manufacturer_name: string;
        car_model: string;
        pi: number;
        class: string;
        time_ms: number;
        notes: string | null;
        recorded_at: string;
      }>
    >(
      `SELECT circuit.name AS circuit_name,
        manufacturer.name AS manufacturer_name,
        car.model AS car_model,
        lap.pi, lap.class, lap.time_ms, lap.notes, lap.recorded_at
      FROM lap
      JOIN circuit ON circuit.id = lap.circuit_id
      JOIN car ON car.id = lap.car_id
      JOIN manufacturer ON manufacturer.id = car.manufacturer_id
      ORDER BY lap.recorded_at, lap.id`,
    ),
    db.select<BackupSourceRows["settings"]>(
      `SELECT key, value FROM setting ORDER BY key`,
    ),
  ]);

  return {
    manufacturers,
    cars,
    circuits,
    laps: laps.map((lap) => ({
      ...lap,
      class: lap.class as CarClass,
    })),
    settings,
  };
}

/** Open a backup file and Zod-validate; no DB writes. */
export async function openBackupForImport(): Promise<OpenBackupResult> {
  const path = await open({
    filters: BACKUP_FILTERS,
    multiple: false,
  });
  if (path === null) return "cancelled";
  const text = await readTextFile(path);
  const parsed = parseBackupJson(text);
  if (!parsed.ok) {
    return { error: parsed.message };
  }
  return { backup: parsed.data };
}

/**
 * Apply an already-validated backup (Replace/Merge after open+validate).
 * Closes plugin-sql before the Rust single-connection transaction.
 */
export async function applyParsedBackup(
  backup: BackupFileV1,
  mode: ApplyMode,
): Promise<"imported" | { error: string }> {
  const db = await getDb();
  try {
    await applyBackup(db, backup, mode, async (_db, ops) => {
      await closeDb();
      try {
        await applyBackupOpsNative(ops);
      } finally {
        await getDb();
      }
    });
    if (mode === "replace") {
      await runSeedUpsert();
    }
    return "imported";
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Parse + apply backup text without file dialogs (unit-testable).
 * Fail-closed: invalid JSON/schema never calls applyBackup.
 */
export async function importBackupText(
  text: string,
  mode: ApplyMode,
): Promise<"imported" | { error: string }> {
  const parsed = parseBackupJson(text);
  if (!parsed.ok) {
    return { error: parsed.message };
  }
  return applyParsedBackup(parsed.data, mode);
}

export async function exportBackup(): Promise<ExportBackupResult> {
  const appVersion = await getVersion();
  const db = await getDb();
  const rows = await selectBackupSourceRows(db);
  const payload = buildBackupPayload(rows, appVersion);
  const date = new Date().toISOString().slice(0, 10);
  const path = await save({
    filters: BACKUP_FILTERS,
    defaultPath: `forza-lap-tracker-backup-${date}.fltbackup.json`,
  });
  if (path === null) return "cancelled";
  await writeTextFile(path, `${JSON.stringify(payload, null, 2)}\n`);
  return "saved";
}

/** @deprecated Prefer openBackupForImport + applyParsedBackup (spec UX order). */
export async function importBackup(
  mode: ApplyMode,
): Promise<ImportBackupResult> {
  const opened = await openBackupForImport();
  if (opened === "cancelled") return "cancelled";
  if ("error" in opened) return { error: opened.error };
  return applyParsedBackup(opened.backup, mode);
}
