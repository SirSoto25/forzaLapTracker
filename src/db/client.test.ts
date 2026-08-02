import { beforeEach, expect, it, vi } from "vitest";

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
  select.mockReset().mockResolvedValue([{ count: 0 }]);
  vi.resetModules();
});

it("loads the app database and seeds an empty catalog once", async () => {
  const { initDb } = await import("./client");

  await initDb();
  await initDb();

  expect(load).toHaveBeenCalledOnce();
  expect(load).toHaveBeenCalledWith("sqlite:forza_lap_tracker.db");
  expect(execute).toHaveBeenCalledTimes(19);
});
