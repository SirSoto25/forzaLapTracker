import Database from "@tauri-apps/plugin-sql";
import cars from "../../seed/cars.json";
import circuits from "../../seed/circuits.json";
import manufacturers from "../../seed/manufacturers.json";

const DB_URL = "sqlite:forza_lap_tracker.db";

let dbPromise: Promise<Database> | undefined;
let initPromise: Promise<void> | undefined;

async function seed(db: Database): Promise<void> {
  for (const manufacturer of manufacturers) {
    await db.execute(
      "INSERT OR IGNORE INTO manufacturer (name, icon_path) VALUES ($1, $2)",
      [manufacturer.name, manufacturer.icon],
    );
  }

  const rows = await db.select<Array<{ id: number; name: string }>>(
    "SELECT id, name FROM manufacturer",
  );
  const manufacturerIds = new Map(
    manufacturers.map((manufacturer) => [
      manufacturer.slug,
      rows.find((row) => row.name === manufacturer.name)?.id,
    ]),
  );

  for (const car of cars) {
    await db.execute(
      "INSERT OR IGNORE INTO car (manufacturer_id, model, image_url) VALUES ($1, $2, $3)",
      [manufacturerIds.get(car.manufacturer_slug), car.model, car.image_url],
    );
  }
  for (const circuit of circuits) {
    await db.execute("INSERT OR IGNORE INTO circuit (name) VALUES ($1)", [
      circuit.name,
    ]);
  }
}

export function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await (dbPromise ??= Database.load(DB_URL));
      const [{ count }] = await db.select<Array<{ count: number }>>(
        "SELECT COUNT(*) AS count FROM circuit",
      );
      if (count === 0) await seed(db);
    })();
  }
  return initPromise;
}

export async function getDb(): Promise<Database> {
  await initDb();
  return dbPromise!;
}
