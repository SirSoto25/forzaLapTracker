//! Apply backup ops in a single rusqlite transaction (real atomicity).

use rusqlite::{params, Connection};
use serde::Deserialize;
use tauri::{AppHandle, Manager};

const DB_FILE: &str = "forza_lap_tracker.db";

#[derive(Debug, Deserialize)]
#[serde(tag = "kind")]
pub enum ApplyOp {
    #[serde(rename = "deleteAll")]
    DeleteAll { table: String },
    #[serde(rename = "insertManufacturer")]
    InsertManufacturer {
        name: String,
        icon_path: String,
        is_builtin: i64,
    },
    #[serde(rename = "upsertManufacturer")]
    UpsertManufacturer {
        name: String,
        icon_path: String,
        is_builtin: i64,
    },
    #[serde(rename = "insertCar")]
    InsertCar {
        manufacturer_name: String,
        model: String,
        is_builtin: i64,
        image_url: Option<String>,
    },
    #[serde(rename = "upsertCar")]
    UpsertCar {
        manufacturer_name: String,
        model: String,
        is_builtin: i64,
        image_url: Option<String>,
    },
    #[serde(rename = "insertCircuit")]
    InsertCircuit { name: String, is_builtin: i64 },
    #[serde(rename = "upsertCircuit")]
    UpsertCircuit { name: String, is_builtin: i64 },
    #[serde(rename = "insertLap")]
    InsertLap {
        circuit_name: String,
        manufacturer_name: String,
        car_model: String,
        pi: i64,
        class: String,
        time_ms: i64,
        notes: Option<String>,
        recorded_at: String,
    },
    #[serde(rename = "upsertSetting")]
    UpsertSetting { key: String, value: String },
}

fn db_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    // Must match tauri-plugin-sql: sqlite paths are under app_config_dir.
    let base = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("app_config_dir: {e}"))?;
    Ok(base.join(DB_FILE))
}

fn require_rows(rows: usize, op: &str) -> Result<(), String> {
    if rows == 0 {
        return Err(format!("{op} affected 0 rows"));
    }
    Ok(())
}

fn execute_op(conn: &Connection, op: &ApplyOp) -> Result<(), String> {
    match op {
        ApplyOp::DeleteAll { table } => {
            let allowed = ["lap", "car", "circuit", "manufacturer", "setting"];
            if !allowed.contains(&table.as_str()) {
                return Err(format!("invalid deleteAll table: {table}"));
            }
            conn.execute(&format!("DELETE FROM {table}"), [])
                .map_err(|e| format!("deleteAll({table}): {e}"))?;
            Ok(())
        }
        ApplyOp::InsertManufacturer {
            name,
            icon_path,
            is_builtin,
        } => {
            let n = conn
                .execute(
                    "INSERT INTO manufacturer (name, icon_path, is_builtin) VALUES (?1, ?2, ?3)",
                    params![name, icon_path, is_builtin],
                )
                .map_err(|e| format!("insertManufacturer: {e}"))?;
            require_rows(n, "insertManufacturer")
        }
        ApplyOp::UpsertManufacturer {
            name,
            icon_path,
            is_builtin,
        } => {
            conn.execute(
                "INSERT INTO manufacturer (name, icon_path, is_builtin)
                VALUES (?1, ?2, ?3)
                ON CONFLICT(name) DO UPDATE SET
                  icon_path = excluded.icon_path,
                  is_builtin = excluded.is_builtin",
                params![name, icon_path, is_builtin],
            )
            .map_err(|e| format!("upsertManufacturer: {e}"))?;
            Ok(())
        }
        ApplyOp::InsertCar {
            manufacturer_name,
            model,
            is_builtin,
            image_url,
        } => {
            let n = conn
                .execute(
                    "INSERT INTO car (manufacturer_id, model, is_builtin, image_url)
                    SELECT id, ?1, ?2, ?3 FROM manufacturer WHERE name = ?4",
                    params![model, is_builtin, image_url, manufacturer_name],
                )
                .map_err(|e| format!("insertCar: {e}"))?;
            require_rows(n, "insertCar")
        }
        ApplyOp::UpsertCar {
            manufacturer_name,
            model,
            is_builtin,
            image_url,
        } => {
            conn.execute(
                "INSERT INTO car (manufacturer_id, model, is_builtin, image_url)
                SELECT id, ?1, ?2, ?3 FROM manufacturer WHERE name = ?4
                ON CONFLICT(manufacturer_id, model) DO UPDATE SET
                  image_url = CASE
                    WHEN car.is_builtin = 1 THEN car.image_url
                    ELSE excluded.image_url
                  END",
                params![model, is_builtin, image_url, manufacturer_name],
            )
            .map_err(|e| format!("upsertCar: {e}"))?;
            Ok(())
        }
        ApplyOp::InsertCircuit { name, is_builtin } => {
            let n = conn
                .execute(
                    "INSERT INTO circuit (name, is_builtin) VALUES (?1, ?2)",
                    params![name, is_builtin],
                )
                .map_err(|e| format!("insertCircuit: {e}"))?;
            require_rows(n, "insertCircuit")
        }
        ApplyOp::UpsertCircuit { name, is_builtin } => {
            // ON CONFLICT DO NOTHING may affect 0 rows — allowed.
            conn.execute(
                "INSERT INTO circuit (name, is_builtin) VALUES (?1, ?2)
                ON CONFLICT(name) DO NOTHING",
                params![name, is_builtin],
            )
            .map_err(|e| format!("upsertCircuit: {e}"))?;
            Ok(())
        }
        ApplyOp::InsertLap {
            circuit_name,
            manufacturer_name,
            car_model,
            pi,
            class,
            time_ms,
            notes,
            recorded_at,
        } => {
            let n = conn
                .execute(
                    "INSERT INTO lap (
                      circuit_id, car_id, pi, class, time_ms, notes, recorded_at
                    )
                    SELECT c.id, car.id, ?1, ?2, ?3, ?4, ?5
                    FROM circuit c
                    JOIN manufacturer m ON m.name = ?6
                    JOIN car ON car.manufacturer_id = m.id AND car.model = ?7
                    WHERE c.name = ?8",
                    params![
                        pi,
                        class,
                        time_ms,
                        notes,
                        recorded_at,
                        manufacturer_name,
                        car_model,
                        circuit_name
                    ],
                )
                .map_err(|e| format!("insertLap: {e}"))?;
            require_rows(n, "insertLap")
        }
        ApplyOp::UpsertSetting { key, value } => {
            conn.execute(
                "INSERT INTO setting (key, value) VALUES (?1, ?2)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                params![key, value],
            )
            .map_err(|e| format!("upsertSetting: {e}"))?;
            Ok(())
        }
    }
}

fn apply_ops_on_connection(conn: &mut Connection, ops: &[ApplyOp]) -> Result<(), String> {
    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(|e| format!("PRAGMA foreign_keys: {e}"))?;
    conn.busy_timeout(std::time::Duration::from_secs(5))
        .map_err(|e| format!("busy_timeout: {e}"))?;

    let tx = conn
        .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)
        .map_err(|e| format!("BEGIN IMMEDIATE: {e}"))?;

    for op in ops {
        execute_op(&tx, op)?;
    }

    tx.commit().map_err(|e| format!("COMMIT: {e}"))?;
    Ok(())
}

/// Apply serialized backup ops in one SQLite transaction on the app DB file.
#[tauri::command]
pub fn apply_backup_ops(app: AppHandle, ops: Vec<ApplyOp>) -> Result<(), String> {
    let path = db_path(&app)?;
    if !path.is_file() {
        return Err(format!("database not found at {}", path.display()));
    }

    let mut conn = Connection::open(&path).map_err(|e| format!("open db: {e}"))?;
    apply_ops_on_connection(&mut conn, &ops)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup_conn() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "
            PRAGMA foreign_keys = ON;
            CREATE TABLE manufacturer (
              id INTEGER PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              icon_path TEXT NOT NULL,
              is_builtin INTEGER NOT NULL
            );
            CREATE TABLE car (
              id INTEGER PRIMARY KEY,
              manufacturer_id INTEGER NOT NULL REFERENCES manufacturer(id),
              model TEXT NOT NULL,
              is_builtin INTEGER NOT NULL,
              image_url TEXT,
              UNIQUE(manufacturer_id, model)
            );
            CREATE TABLE circuit (
              id INTEGER PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              is_builtin INTEGER NOT NULL
            );
            CREATE TABLE lap (
              id INTEGER PRIMARY KEY,
              circuit_id INTEGER NOT NULL REFERENCES circuit(id),
              car_id INTEGER NOT NULL REFERENCES car(id),
              pi INTEGER NOT NULL,
              class TEXT NOT NULL,
              time_ms INTEGER NOT NULL,
              notes TEXT,
              recorded_at TEXT NOT NULL
            );
            CREATE TABLE setting (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            ",
        )
        .unwrap();
        conn
    }

    #[test]
    fn insert_car_zero_rows_errors_and_rolls_back() {
        let mut conn = setup_conn();
        let ops = vec![
            ApplyOp::InsertManufacturer {
                name: "Ford".into(),
                icon_path: "brands/ford.svg".into(),
                is_builtin: 1,
            },
            ApplyOp::InsertCar {
                manufacturer_name: "Missing".into(),
                model: "GT".into(),
                is_builtin: 0,
                image_url: None,
            },
        ];
        let err = apply_ops_on_connection(&mut conn, &ops).unwrap_err();
        assert!(err.contains("insertCar"));
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM manufacturer", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }
}
