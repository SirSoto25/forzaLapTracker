import { invoke } from "@tauri-apps/api/core";
import { piToClass, type CarClass } from "../../domain/piClass";
import type { BackupFileV1 } from "./schema";

export type ApplyMode = "replace" | "merge";

export type ExistingSnapshot = {
  manufacturers: Array<{
    name: string;
    icon_path: string;
    is_builtin: 0 | 1;
  }>;
  cars: Array<{
    manufacturer_name: string;
    model: string;
    is_builtin: 0 | 1;
    image_url: string | null;
  }>;
  circuits: Array<{ name: string; is_builtin: 0 | 1 }>;
  laps: Array<{
    circuit_name: string;
    manufacturer_name: string;
    car_model: string;
    pi: number;
    time_ms: number;
    recorded_at: string;
  }>;
  settings: Array<{ key: string; value: string }>;
};

export type ApplyOp =
  | {
      kind: "deleteAll";
      table: "lap" | "car" | "circuit" | "manufacturer" | "setting";
    }
  | {
      kind: "insertManufacturer";
      name: string;
      icon_path: string;
      is_builtin: 0 | 1;
    }
  | {
      kind: "upsertManufacturer";
      name: string;
      icon_path: string;
      is_builtin: 0 | 1;
    }
  | {
      kind: "insertCar";
      manufacturer_name: string;
      model: string;
      is_builtin: 0 | 1;
      image_url: string | null;
    }
  | {
      kind: "upsertCar";
      manufacturer_name: string;
      model: string;
      is_builtin: 0 | 1;
      image_url: string | null;
    }
  | {
      kind: "insertCircuit";
      name: string;
      is_builtin: 0 | 1;
    }
  | {
      kind: "upsertCircuit";
      name: string;
      is_builtin: 0 | 1;
    }
  | {
      kind: "insertLap";
      circuit_name: string;
      manufacturer_name: string;
      car_model: string;
      pi: number;
      class: CarClass;
      time_ms: number;
      notes: string | null;
      recorded_at: string;
    }
  | {
      kind: "upsertSetting";
      key: string;
      value: string;
    };

export type ApplyDb = {
  execute(
    query: string,
    bindValues?: unknown[],
  ): Promise<{ rowsAffected: number; lastInsertId?: number }>;
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
};

export type ApplyOpsExecutor = (db: ApplyDb, ops: ApplyOp[]) => Promise<void>;

type LapDedupeFields = {
  circuit_name: string;
  manufacturer_name: string;
  car_model: string;
  pi: number;
  time_ms: number;
  recorded_at: string;
};

export function lapDedupeKey(lap: LapDedupeFields): string {
  return [
    lap.circuit_name,
    lap.manufacturer_name,
    lap.car_model,
    String(lap.pi),
    String(lap.time_ms),
    lap.recorded_at,
  ].join("\u0000");
}

function lapInsertOp(
  lap: BackupFileV1["data"]["laps"][number],
): Extract<ApplyOp, { kind: "insertLap" }> {
  return {
    kind: "insertLap",
    circuit_name: lap.circuit_name,
    manufacturer_name: lap.manufacturer_name,
    car_model: lap.car_model,
    pi: lap.pi,
    class: piToClass(lap.pi),
    time_ms: lap.time_ms,
    notes: lap.notes,
    recorded_at: lap.recorded_at,
  };
}

/** Ordered ops: wipe user tables (FK-safe), then insert backup rows. */
export function planReplace(backup: BackupFileV1): ApplyOp[] {
  const ops: ApplyOp[] = [
    { kind: "deleteAll", table: "lap" },
    { kind: "deleteAll", table: "car" },
    { kind: "deleteAll", table: "circuit" },
    { kind: "deleteAll", table: "manufacturer" },
    { kind: "deleteAll", table: "setting" },
  ];

  for (const m of backup.data.manufacturers) {
    ops.push({
      kind: "insertManufacturer",
      name: m.name,
      icon_path: m.icon_path,
      is_builtin: m.is_builtin,
    });
  }
  for (const c of backup.data.cars) {
    ops.push({
      kind: "insertCar",
      manufacturer_name: c.manufacturer_name,
      model: c.model,
      is_builtin: c.is_builtin,
      image_url: c.image_url,
    });
  }
  for (const c of backup.data.circuits) {
    ops.push({
      kind: "insertCircuit",
      name: c.name,
      is_builtin: c.is_builtin,
    });
  }
  for (const lap of backup.data.laps) {
    ops.push(lapInsertOp(lap));
  }
  for (const s of backup.data.settings) {
    ops.push({ kind: "upsertSetting", key: s.key, value: s.value });
  }

  return ops;
}

/**
 * Ordered ops: natural-key upserts; insert only non-duplicate laps.
 * Builtin local manufacturers keep their icon_path.
 */
export function planMerge(
  backup: BackupFileV1,
  existing: ExistingSnapshot,
): ApplyOp[] {
  const ops: ApplyOp[] = [];
  const localMfg = new Map(existing.manufacturers.map((m) => [m.name, m]));

  for (const m of backup.data.manufacturers) {
    const local = localMfg.get(m.name);
    ops.push({
      kind: "upsertManufacturer",
      name: m.name,
      icon_path:
        local?.is_builtin === 1 ? local.icon_path : m.icon_path,
      is_builtin: local?.is_builtin === 1 ? 1 : m.is_builtin,
    });
  }

  for (const c of backup.data.cars) {
    ops.push({
      kind: "upsertCar",
      manufacturer_name: c.manufacturer_name,
      model: c.model,
      is_builtin: c.is_builtin,
      image_url: c.image_url,
    });
  }

  for (const c of backup.data.circuits) {
    ops.push({
      kind: "upsertCircuit",
      name: c.name,
      is_builtin: c.is_builtin,
    });
  }

  const existingKeys = new Set(existing.laps.map(lapDedupeKey));
  for (const lap of backup.data.laps) {
    if (existingKeys.has(lapDedupeKey(lap))) continue;
    ops.push(lapInsertOp(lap));
  }

  for (const s of backup.data.settings) {
    ops.push({ kind: "upsertSetting", key: s.key, value: s.value });
  }

  return ops;
}

async function requireInsert(
  db: ApplyDb,
  kind: string,
  query: string,
  bindValues?: unknown[],
): Promise<void> {
  const result = await db.execute(query, bindValues);
  if (result.rowsAffected === 0) {
    throw new Error(`${kind} affected 0 rows`);
  }
}

async function executeOp(db: ApplyDb, op: ApplyOp): Promise<void> {
  switch (op.kind) {
    case "deleteAll":
      await db.execute(`DELETE FROM ${op.table}`);
      return;
    case "insertManufacturer":
      await requireInsert(
        db,
        op.kind,
        `INSERT INTO manufacturer (name, icon_path, is_builtin)
        VALUES ($1, $2, $3)`,
        [op.name, op.icon_path, op.is_builtin],
      );
      return;
    case "upsertManufacturer":
      await db.execute(
        `INSERT INTO manufacturer (name, icon_path, is_builtin)
        VALUES ($1, $2, $3)
        ON CONFLICT(name) DO UPDATE SET
          icon_path = excluded.icon_path,
          is_builtin = excluded.is_builtin`,
        [op.name, op.icon_path, op.is_builtin],
      );
      return;
    case "insertCar":
      await requireInsert(
        db,
        op.kind,
        `INSERT INTO car (manufacturer_id, model, is_builtin, image_url)
        SELECT id, $1, $2, $3 FROM manufacturer WHERE name = $4`,
        [op.model, op.is_builtin, op.image_url, op.manufacturer_name],
      );
      return;
    case "upsertCar":
      await db.execute(
        `INSERT INTO car (manufacturer_id, model, is_builtin, image_url)
        SELECT id, $1, $2, $3 FROM manufacturer WHERE name = $4
        ON CONFLICT(manufacturer_id, model) DO UPDATE SET
          image_url = CASE
            WHEN car.is_builtin = 1 THEN car.image_url
            ELSE excluded.image_url
          END`,
        [op.model, op.is_builtin, op.image_url, op.manufacturer_name],
      );
      return;
    case "insertCircuit":
      await requireInsert(
        db,
        op.kind,
        `INSERT INTO circuit (name, is_builtin) VALUES ($1, $2)`,
        [op.name, op.is_builtin],
      );
      return;
    case "upsertCircuit":
      await db.execute(
        `INSERT INTO circuit (name, is_builtin) VALUES ($1, $2)
        ON CONFLICT(name) DO NOTHING`,
        [op.name, op.is_builtin],
      );
      return;
    case "insertLap":
      await requireInsert(
        db,
        op.kind,
        `INSERT INTO lap (
          circuit_id, car_id, pi, class, time_ms, notes, recorded_at
        )
        SELECT c.id, car.id, $1, $2, $3, $4, $5
        FROM circuit c
        JOIN manufacturer m ON m.name = $6
        JOIN car ON car.manufacturer_id = m.id AND car.model = $7
        WHERE c.name = $8`,
        [
          op.pi,
          op.class,
          op.time_ms,
          op.notes,
          op.recorded_at,
          op.manufacturer_name,
          op.car_model,
          op.circuit_name,
        ],
      );
      return;
    case "upsertSetting":
      await db.execute(
        `INSERT INTO setting (key, value) VALUES ($1, $2)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [op.key, op.value],
      );
      return;
  }
}

export async function loadExistingSnapshot(
  db: ApplyDb,
): Promise<ExistingSnapshot> {
  const manufacturers = await db.select<ExistingSnapshot["manufacturers"]>(
    `SELECT name, icon_path, is_builtin FROM manufacturer`,
  );
  const cars = await db.select<ExistingSnapshot["cars"]>(
    `SELECT manufacturer.name AS manufacturer_name, car.model, car.is_builtin,
      car.image_url
    FROM car
    JOIN manufacturer ON manufacturer.id = car.manufacturer_id`,
  );
  const circuits = await db.select<ExistingSnapshot["circuits"]>(
    `SELECT name, is_builtin FROM circuit`,
  );
  const laps = await db.select<ExistingSnapshot["laps"]>(
    `SELECT circuit.name AS circuit_name,
      manufacturer.name AS manufacturer_name,
      car.model AS car_model,
      lap.pi, lap.time_ms, lap.recorded_at
    FROM lap
    JOIN circuit ON circuit.id = lap.circuit_id
    JOIN car ON car.id = lap.car_id
    JOIN manufacturer ON manufacturer.id = car.manufacturer_id`,
  );
  const settings = await db.select<ExistingSnapshot["settings"]>(
    `SELECT key, value FROM setting`,
  );
  return { manufacturers, cars, circuits, laps, settings };
}

/**
 * Testable ApplyDb executor (mock DB). Not atomic under plugin-sql pooling —
 * production uses `apply_backup_ops` via invoke instead.
 */
export async function executeApplyOps(
  db: ApplyDb,
  ops: ApplyOp[],
): Promise<void> {
  await db.execute("BEGIN IMMEDIATE");
  try {
    for (const op of ops) {
      await executeOp(db, op);
    }
    await db.execute("COMMIT");
  } catch (err) {
    try {
      await db.execute("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    throw err;
  }
}

/** Production executor: single-connection transaction in Rust. */
export async function applyBackupOpsNative(ops: ApplyOp[]): Promise<void> {
  await invoke("apply_backup_ops", { ops });
}

/** Apply a validated backup. Production uses Rust; tests inject executeApplyOps. */
export async function applyBackup(
  db: ApplyDb,
  backup: BackupFileV1,
  mode: ApplyMode,
  executeOps: ApplyOpsExecutor = async (_db, ops) => {
    await applyBackupOpsNative(ops);
  },
): Promise<void> {
  const ops =
    mode === "replace"
      ? planReplace(backup)
      : planMerge(backup, await loadExistingSnapshot(db));
  await executeOps(db, ops);
}
