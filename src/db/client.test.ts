import { beforeEach, expect, it, vi } from "vitest";
import manufacturers from "../../seed/manufacturers.json";
import meta from "../../seed/meta.json";

const { execute, load, select } = vi.hoisted(() => ({
  execute: vi.fn().mockResolvedValue({ rowsAffected: 1, lastInsertId: 1 }),
  load: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-sql", () => ({
  default: { load },
}));

beforeEach(() => {
  execute.mockClear();
  load.mockReset().mockResolvedValue({ execute, select });
  select.mockReset().mockImplementation(async (sql: string) => {
    if (sql.includes("FROM setting")) return [];
    if (sql.includes("FROM manufacturer")) {
      return manufacturers.map((manufacturer, index) => ({
        id: index + 1,
        name: manufacturer.name,
      }));
    }
    if (sql.includes("is_builtin")) return [];
    return [];
  });
  vi.resetModules();
});

it("loads the app database and upserts the FH6 catalog when seed is outdated", async () => {
  const { initDb } = await import("./client");

  await initDb();
  await initDb();

  expect(load).toHaveBeenCalledOnce();
  expect(load).toHaveBeenCalledWith("sqlite:forza_lap_tracker.db");
  expect(execute).toHaveBeenCalledWith("PRAGMA foreign_keys = ON");
  expect(execute).toHaveBeenCalledWith(
    expect.stringContaining("INSERT INTO manufacturer"),
    expect.arrayContaining([manufacturers[0].name, manufacturers[0].icon]),
  );
  expect(execute).toHaveBeenCalledWith(
    expect.stringContaining("INSERT INTO circuit"),
    expect.any(Array),
  );
  expect(execute).toHaveBeenCalledWith(
    expect.stringContaining("INSERT INTO car"),
    expect.any(Array),
  );
  expect(execute).toHaveBeenCalledWith(
    expect.stringContaining("ON CONFLICT(key)"),
    ["seed_version", String(meta.seed_version)],
  );
});

it("skips catalog upsert when seed_version already matches", async () => {
  select.mockImplementation(async (sql: string) => {
    if (sql.includes("FROM setting")) {
      return [{ value: String(meta.seed_version) }];
    }
    return [];
  });
  const { initDb } = await import("./client");
  await initDb();
  expect(execute).toHaveBeenCalledTimes(1);
  expect(execute).toHaveBeenCalledWith("PRAGMA foreign_keys = ON");
});
