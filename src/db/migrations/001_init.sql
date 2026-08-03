CREATE TABLE IF NOT EXISTS manufacturer (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon_path TEXT NOT NULL,
  is_builtin INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS car (
  id INTEGER PRIMARY KEY,
  manufacturer_id INTEGER NOT NULL REFERENCES manufacturer(id),
  model TEXT NOT NULL,
  is_builtin INTEGER NOT NULL DEFAULT 1,
  image_path TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(manufacturer_id, model)
);
CREATE TABLE IF NOT EXISTS circuit (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_builtin INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lap (
  id INTEGER PRIMARY KEY,
  circuit_id INTEGER NOT NULL REFERENCES circuit(id),
  car_id INTEGER NOT NULL REFERENCES car(id),
  pi INTEGER NOT NULL CHECK (pi >= 0 AND pi <= 999),
  class TEXT NOT NULL,
  time_ms INTEGER NOT NULL CHECK (time_ms >= 0),
  notes TEXT,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS setting (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lap_circuit_time ON lap(circuit_id, time_ms);
CREATE INDEX IF NOT EXISTS idx_lap_car ON lap(car_id);
