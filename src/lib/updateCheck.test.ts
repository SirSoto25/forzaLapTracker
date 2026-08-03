import { beforeEach, expect, it, vi } from "vitest";
import {
  checkForAppUpdate,
  fetchLatestRelease,
  shouldNotifyUpdate,
} from "./updateCheck";

beforeEach(() => {
  vi.restoreAllMocks();
});

it("shouldNotifyUpdate only when remote is newer and not dismissed", () => {
  expect(shouldNotifyUpdate("0.1.0", "v0.1.1", null)).toBe(true);
  expect(shouldNotifyUpdate("0.1.1", "v0.1.1", null)).toBe(false);
  expect(shouldNotifyUpdate("0.1.0", "v0.1.1", "0.1.1")).toBe(false);
  expect(shouldNotifyUpdate("0.1.0", "v0.1.1", "0.1.0")).toBe(true);
});

it("fetchLatestRelease parses GitHub JSON", async () => {
  const fetchImpl = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      tag_name: "v0.2.0",
      html_url: "https://github.com/SirSoto25/forzaLapTracker/releases/tag/v0.2.0",
    }),
  });
  await expect(fetchLatestRelease(fetchImpl)).resolves.toEqual({
    tagName: "v0.2.0",
    htmlUrl: "https://github.com/SirSoto25/forzaLapTracker/releases/tag/v0.2.0",
  });
  expect(fetchImpl).toHaveBeenCalledWith(
    "https://api.github.com/repos/SirSoto25/forzaLapTracker/releases/latest",
    expect.objectContaining({
      headers: expect.objectContaining({
        Accept: "application/vnd.github+json",
      }),
    }),
  );
});

it("fetchLatestRelease returns null on failure", async () => {
  const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
  await expect(fetchLatestRelease(fetchImpl)).resolves.toBeNull();
});

it("checkForAppUpdate returns available when newer", async () => {
  const fetchImpl = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      tag_name: "v0.1.1",
      html_url: "https://github.com/SirSoto25/forzaLapTracker/releases/tag/v0.1.1",
    }),
  });
  await expect(
    checkForAppUpdate({
      localVersion: "0.1.0",
      dismissedVersion: null,
      fetchImpl,
    }),
  ).resolves.toEqual({
    status: "available",
    info: {
      localVersion: "0.1.0",
      remoteVersion: "0.1.1",
      releaseUrl: "https://github.com/SirSoto25/forzaLapTracker/releases/tag/v0.1.1",
    },
  });
});

it("checkForAppUpdate returns upToDate when remote is not newer", async () => {
  const fetchImpl = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      tag_name: "v0.1.0",
      html_url: "https://github.com/SirSoto25/forzaLapTracker/releases/tag/v0.1.0",
    }),
  });
  await expect(
    checkForAppUpdate({
      localVersion: "0.1.0",
      dismissedVersion: null,
      fetchImpl,
    }),
  ).resolves.toEqual({ status: "upToDate" });
});

it("checkForAppUpdate returns failed on network/API error", async () => {
  const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
  await expect(
    checkForAppUpdate({
      localVersion: "0.1.0",
      dismissedVersion: null,
      fetchImpl,
    }),
  ).resolves.toEqual({ status: "failed" });
});
