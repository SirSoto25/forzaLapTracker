import { beforeEach, expect, it, vi } from "vitest";

const { getSetting, setSetting } = vi.hoisted(() => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
}));

vi.mock("../lib/api", () => ({ getSetting, setSetting }));

import { loadLocale, setLocale, t } from "./index";

beforeEach(() => {
  getSetting.mockReset().mockResolvedValue(null);
  setSetting.mockReset().mockResolvedValue(undefined);
});

it("defaults to Spanish when no locale is stored", async () => {
  expect(await loadLocale()).toBe("es");
  expect(t("nav.circuits")).toBe("Circuitos");
});

it("loads English and persists locale changes", async () => {
  getSetting.mockResolvedValue("en");

  expect(await loadLocale()).toBe("en");
  expect(t("nav.settings")).toBe("Settings");

  await setLocale("es");
  expect(setSetting).toHaveBeenCalledWith("locale", "es");
  expect(t("nav.settings")).toBe("Ajustes");
});
