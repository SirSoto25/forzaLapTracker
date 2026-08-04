import Database from "@tauri-apps/plugin-sql";
import cars from "../../seed/cars.json";
import circuits from "../../seed/circuits.json";
import manufacturers from "../../seed/manufacturers.json";
import meta from "../../seed/meta.json";

const DB_URL = "sqlite:forza_lap_tracker.db";
const SEED_VERSION = String(meta.seed_version ?? 2);
const SEED_VERSION_KEY = "seed_version";

let dbPromise: Promise<Database> | undefined;
let initPromise: Promise<void> | undefined;

async function getSettingValue(
  db: Database,
  key: string,
): Promise<string | null> {
  const rows = await db.select<Array<{ value: string }>>(
    "SELECT value FROM setting WHERE key = $1",
    [key],
  );
  return rows[0]?.value ?? null;
}

async function setSettingValue(
  db: Database,
  key: string,
  value: string,
): Promise<void> {
  await db.execute(
    `INSERT INTO setting (key, value) VALUES ($1, $2)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

async function manufacturerIdMap(
  db: Database,
): Promise<Map<string, number | undefined>> {
  const rows = await db.select<Array<{ id: number; name: string }>>(
    "SELECT id, name FROM manufacturer",
  );
  const byName = new Map(rows.map((row) => [row.name, row.id]));
  return new Map(
    manufacturers.map((manufacturer) => [
      manufacturer.slug,
      byName.get(manufacturer.name),
    ]),
  );
}

async function upsertSeed(db: Database): Promise<void> {
  for (const manufacturer of manufacturers) {
    await db.execute(
      `INSERT INTO manufacturer (name, icon_path, is_builtin)
      VALUES ($1, $2, 1)
      ON CONFLICT(name) DO UPDATE SET
        icon_path = excluded.icon_path`,
      [manufacturer.name, manufacturer.icon],
    );
  }

  const manufacturerIds = await manufacturerIdMap(db);

  for (const car of cars) {
    const manufacturerId = manufacturerIds.get(car.manufacturer_slug);
    if (manufacturerId === undefined) continue;
    await db.execute(
      `INSERT INTO car (manufacturer_id, model, image_url, is_builtin)
      VALUES ($1, $2, $3, 1)
      ON CONFLICT(manufacturer_id, model) DO NOTHING`,
      [manufacturerId, car.model, car.image_url],
    );
  }

  for (const circuit of circuits) {
    await db.execute(
      `INSERT INTO circuit (name, is_builtin) VALUES ($1, 1)
      ON CONFLICT(name) DO NOTHING`,
      [circuit.name],
    );
  }
}

/** Drop obsolete built-ins that nothing references (safe for existing installs). */
async function pruneObsoleteBuiltins(db: Database): Promise<void> {
  const seedCircuitNames = new Set(circuits.map((c) => c.name));
  const obsoleteCircuits = await db.select<Array<{ id: number; name: string }>>(
    `SELECT id, name FROM circuit
    WHERE is_builtin = 1
      AND id NOT IN (SELECT DISTINCT circuit_id FROM lap)`,
  );
  for (const row of obsoleteCircuits) {
    if (seedCircuitNames.has(row.name)) continue;
    await db.execute("DELETE FROM circuit WHERE id = $1", [row.id]);
  }

  const seedCarKeys = new Set(
    cars.map((c) => `${c.manufacturer_slug}::${c.model.toLowerCase()}`),
  );
  const slugByName = new Map(
    manufacturers.map((m) => [m.name, m.slug] as const),
  );
  const obsoleteCars = await db.select<
    Array<{ id: number; model: string; manufacturer_name: string }>
  >(
    `SELECT car.id, car.model, manufacturer.name AS manufacturer_name
    FROM car
    JOIN manufacturer ON manufacturer.id = car.manufacturer_id
    WHERE car.is_builtin = 1
      AND car.id NOT IN (SELECT DISTINCT car_id FROM lap)`,
  );
  for (const row of obsoleteCars) {
    const slug = slugByName.get(row.manufacturer_name);
    if (!slug) continue;
    const key = `${slug}::${row.model.toLowerCase()}`;
    if (seedCarKeys.has(key)) continue;
    await db.execute("DELETE FROM car WHERE id = $1", [row.id]);
  }
}

export function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await (dbPromise ??= Database.load(DB_URL));
      await db.execute("PRAGMA foreign_keys = ON");
      const currentVersion = await getSettingValue(db, SEED_VERSION_KEY);
      if (currentVersion !== SEED_VERSION) {
        await upsertSeed(db);
        await pruneObsoleteBuiltins(db);
        await setSettingValue(db, SEED_VERSION_KEY, SEED_VERSION);
      }
    })();
  }
  return initPromise;
}

/** Re-upsert seed catalog after a replace import so builtins return. */
export async function runSeedUpsert(): Promise<void> {
  const db = await getDb();
  await upsertSeed(db);
  await setSettingValue(db, SEED_VERSION_KEY, SEED_VERSION);
}

export async function getDb(): Promise<Database> {
  await initDb();
  return dbPromise!;
}

/** Close the plugin-sql pool so another process/connection can write the file. */
export async function closeDb(): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.close();
  dbPromise = undefined;
  initPromise = undefined;
}
