import { getDb } from "../db/client";
import type {
  Car,
  Circuit,
  Lap,
  LapFilters,
  Manufacturer,
  NewLap,
} from "../db/types";
import { piToClass } from "../domain/piClass";

const LAP_SELECT = `SELECT lap.*, circuit.name AS circuit_name,
  car.model AS car_model, manufacturer.name AS manufacturer_name
FROM lap
JOIN circuit ON circuit.id = lap.circuit_id
JOIN car ON car.id = lap.car_id
JOIN manufacturer ON manufacturer.id = car.manufacturer_id`;

export async function listCircuits(): Promise<Circuit[]> {
  const db = await getDb();
  return db.select("SELECT * FROM circuit ORDER BY is_builtin DESC, name");
}

export async function createCircuit(name: string): Promise<number> {
  const value = name.trim();
  if (!value) throw new Error("Circuit name is required");
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO circuit (name, is_builtin) VALUES ($1, 0)",
    [value],
  );
  return result.lastInsertId!;
}

export async function listManufacturers(): Promise<Manufacturer[]> {
  const db = await getDb();
  return db.select("SELECT * FROM manufacturer ORDER BY name");
}

export async function listCars(manufacturerId?: number): Promise<Car[]> {
  const db = await getDb();
  const sql = `SELECT car.*, manufacturer.name AS manufacturer_name,
    manufacturer.icon_path AS manufacturer_icon_path
  FROM car JOIN manufacturer ON manufacturer.id = car.manufacturer_id
  ${manufacturerId === undefined ? "" : "WHERE manufacturer_id = $1"}
  ORDER BY manufacturer.name, car.model`;
  return db.select(sql, manufacturerId === undefined ? [] : [manufacturerId]);
}

export async function createCar(
  manufacturerId: number,
  model: string,
  imageUrl: string | null = null,
  imagePath: string | null = null,
): Promise<number> {
  const value = model.trim();
  if (!value) throw new Error("Car model is required");
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO car
      (manufacturer_id, model, is_builtin, image_url, image_path)
    VALUES ($1, $2, 0, $3, $4)`,
    [manufacturerId, value, imageUrl, imagePath],
  );
  return result.lastInsertId!;
}

/** Stub until Task 10 wires Tauri download; never blocks lap save. */
export async function ensureCarImage(_carId: number): Promise<string | null> {
  return null;
}

export async function insertLap(lap: NewLap): Promise<number> {
  if (!Number.isInteger(lap.timeMs) || lap.timeMs < 0) {
    throw new Error("timeMs must be a non-negative integer");
  }
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO lap (circuit_id, car_id, pi, class, time_ms, notes)
    VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      lap.circuitId,
      lap.carId,
      lap.pi,
      piToClass(lap.pi),
      lap.timeMs,
      lap.notes ?? null,
    ],
  );
  return result.lastInsertId!;
}

export async function listLaps(filters: LapFilters = {}): Promise<Lap[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  const add = (condition: string, value: unknown) => {
    values.push(value);
    conditions.push(`${condition} $${values.length}`);
  };

  if (filters.circuitId !== undefined) add("lap.circuit_id =", filters.circuitId);
  if (filters.carId !== undefined) add("lap.car_id =", filters.carId);
  if (filters.class !== undefined) add("lap.class =", filters.class);
  if (filters.dateFrom !== undefined) {
    add("date(lap.recorded_at) >=", filters.dateFrom);
  }
  if (filters.dateTo !== undefined) add("date(lap.recorded_at) <=", filters.dateTo);

  const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
  const order =
    filters.sort === "date" ? "lap.recorded_at DESC" : "lap.time_ms ASC";
  const db = await getDb();
  return db.select(`${LAP_SELECT}${where} ORDER BY ${order}`, values);
}

export async function bestLap(
  circuitId: number,
  carId?: number,
): Promise<Lap | null> {
  const db = await getDb();
  const values = carId === undefined ? [circuitId] : [circuitId, carId];
  const carFilter = carId === undefined ? "" : " AND lap.car_id = $2";
  const rows = await db.select<Lap[]>(
    `${LAP_SELECT}
    WHERE lap.circuit_id = $1${carFilter}
    ORDER BY lap.time_ms ASC LIMIT 1`,
    values,
  );
  return rows[0] ?? null;
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<Array<{ value: string }>>(
    "SELECT value FROM setting WHERE key = $1",
    [key],
  );
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO setting (key, value) VALUES ($1, $2)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}
