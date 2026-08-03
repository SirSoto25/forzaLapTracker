# GitHub Releases + In-App Update Notice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Windows (MSI + NSIS) and Linux (deb + AppImage) installers to GitHub Releases via CI, and show a non-blocking in-app banner when a newer release exists.

**Architecture:** A GitHub Actions workflow uses `tauri-apps/tauri-action` on Windows and Ubuntu matrices to build and publish release assets. The React app checks `releases/latest` once after boot (and from Settings), compares semver to `getVersion()`, and offers a link opened via `plugin-opener`.

**Tech Stack:** Tauri 2, React 19, Vitest, GitHub Actions, `tauri-apps/tauri-action`, `@tauri-apps/plugin-opener`, GitHub Releases API.

## Global Constraints

- Platforms: Windows MSI + NSIS `.exe`; Linux `.deb` + AppImage (no macOS).
- Triggers: tag `v*` and `workflow_dispatch`.
- Releases are published (`releaseDraft: false`), not drafts.
- In-app UX: notify only + open Releases URL; no auto-download / no Tauri updater plugin / no code signing.
- Repo: `SirSoto25/forzaLapTracker`.
- Default locale remains Spanish; all new UI strings in `es.json` + `en.json`.
- Network failures on update check are silent on boot.
- Follow TDD for domain/helpers; run `npm test` after each logic task.
- Do not commit secrets; use `GITHUB_TOKEN` only.

## File map

| File | Responsibility |
| --- | --- |
| `.github/workflows/release.yml` | Build + publish releases |
| `src/lib/semver.ts` | Parse/compare `MAJOR.MINOR.PATCH` |
| `src/lib/semver.test.ts` | Semver unit tests |
| `src/lib/updateCheck.ts` | Fetch GitHub latest + decide if notice shown |
| `src/lib/updateCheck.test.ts` | Update-check unit tests (mock `fetch`) |
| `src/lib/repo.ts` | Constant repo owner/name + API/HTML URLs |
| `src/components/UpdateBanner.tsx` | Banner UI |
| `src/App.tsx` | Boot-time check + render banner |
| `src/pages/SettingsPage.tsx` | Manual “check for updates” |
| `src/i18n/es.json` / `en.json` | Copy |
| `src/App.css` | Banner styles |
| `src-tauri/tauri.conf.json` | CSP `connect-src` for `api.github.com` |
| `src-tauri/capabilities/default.json` | Opener allowlist for `https://github.com/**` if required |
| `README.md` | Releases how-to + download notes |
| `docs/superpowers/specs/2026-08-03-github-releases-update-notice-design.md` | Already written; reference only |

---

### Task 1: Semver helpers (TDD)

**Files:**
- Create: `src/lib/semver.ts`
- Create: `src/lib/semver.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `parseSemver(input: string): { major: number; minor: number; patch: number } | null`
  - `compareSemver(a: string, b: string): number` — negative if `a < b`, 0 if equal, positive if `a > b`; strips optional leading `v`; returns `0` if either side is unparsable (safe default for “no banner”)

- [ ] **Step 1: Write the failing tests**

```ts
import { expect, it } from "vitest";
import { compareSemver, parseSemver } from "./semver";

it("parses v-prefixed and plain versions", () => {
  expect(parseSemver("v1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
  expect(parseSemver("0.1.0")).toEqual({ major: 0, minor: 1, patch: 0 });
});

it("rejects junk", () => {
  expect(parseSemver("nope")).toBeNull();
  expect(parseSemver("1.2")).toBeNull();
});

it("compares versions", () => {
  expect(compareSemver("0.1.0", "v0.1.1")).toBeLessThan(0);
  expect(compareSemver("v0.2.0", "0.1.9")).toBeGreaterThan(0);
  expect(compareSemver("1.0.0", "v1.0.0")).toBe(0);
});

it("treats unparsable as equal (no false update)", () => {
  expect(compareSemver("bad", "1.0.0")).toBe(0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/semver.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `src/lib/semver.ts`**

```ts
export type Semver = { major: number; minor: number; patch: number };

export function parseSemver(input: string): Semver | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/i.exec(input.trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function compareSemver(a: string, b: string): number {
  const left = parseSemver(a);
  const right = parseSemver(b);
  if (!left || !right) return 0;
  if (left.major !== right.major) return left.major - right.major;
  if (left.minor !== right.minor) return left.minor - right.minor;
  return left.patch - right.patch;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/semver.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/semver.ts src/lib/semver.test.ts
git commit -m "feat: add semver parse and compare helpers"
```

---

### Task 2: GitHub latest-release check (TDD)

**Files:**
- Create: `src/lib/repo.ts`
- Create: `src/lib/updateCheck.ts`
- Create: `src/lib/updateCheck.test.ts`

**Interfaces:**
- Consumes: `compareSemver` from `src/lib/semver.ts`
- Produces:
  - `REPO_OWNER = "SirSoto25"`, `REPO_NAME = "forzaLapTracker"`
  - `githubReleasesLatestApiUrl(): string`
  - `type UpdateInfo = { localVersion: string; remoteVersion: string; releaseUrl: string }`
  - `async function fetchLatestRelease(fetchImpl?: typeof fetch): Promise<{ tagName: string; htmlUrl: string } | null>`
  - `function shouldNotifyUpdate(localVersion: string, remoteTag: string, dismissedVersion: string | null): boolean`
  - `async function checkForAppUpdate(options: { localVersion: string; dismissedVersion: string | null; fetchImpl?: typeof fetch }): Promise<UpdateInfo | null>`

- [ ] **Step 1: Write failing tests in `src/lib/updateCheck.test.ts`**

```ts
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

it("checkForAppUpdate returns UpdateInfo when newer", async () => {
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
    localVersion: "0.1.0",
    remoteVersion: "0.1.1",
    releaseUrl: "https://github.com/SirSoto25/forzaLapTracker/releases/tag/v0.1.1",
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- src/lib/updateCheck.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `src/lib/repo.ts` and `src/lib/updateCheck.ts`**

```ts
// src/lib/repo.ts
export const REPO_OWNER = "SirSoto25";
export const REPO_NAME = "forzaLapTracker";

export function githubReleasesLatestApiUrl(): string {
  return `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
}

export function githubReleasesPageUrl(): string {
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`;
}
```

```ts
// src/lib/updateCheck.ts
import { compareSemver, parseSemver } from "./semver";
import { githubReleasesLatestApiUrl } from "./repo";

export type UpdateInfo = {
  localVersion: string;
  remoteVersion: string;
  releaseUrl: string;
};

export function shouldNotifyUpdate(
  localVersion: string,
  remoteTag: string,
  dismissedVersion: string | null,
): boolean {
  if (compareSemver(localVersion, remoteTag) >= 0) return false;
  const remote = parseSemver(remoteTag);
  if (!remote) return false;
  const remoteNorm = `${remote.major}.${remote.minor}.${remote.patch}`;
  if (dismissedVersion && parseSemver(dismissedVersion)) {
    const dismissed = parseSemver(dismissedVersion)!;
    const dismissedNorm = `${dismissed.major}.${dismissed.minor}.${dismissed.patch}`;
    if (dismissedNorm === remoteNorm) return false;
  }
  return true;
}

export async function fetchLatestRelease(
  fetchImpl: typeof fetch = fetch,
): Promise<{ tagName: string; htmlUrl: string } | null> {
  try {
    const response = await fetchImpl(githubReleasesLatestApiUrl(), {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "forza-lap-tracker",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      tag_name?: string;
      html_url?: string;
    };
    if (!data.tag_name || !data.html_url) return null;
    return { tagName: data.tag_name, htmlUrl: data.html_url };
  } catch {
    return null;
  }
}

export async function checkForAppUpdate(options: {
  localVersion: string;
  dismissedVersion: string | null;
  fetchImpl?: typeof fetch;
}): Promise<UpdateInfo | null> {
  const latest = await fetchLatestRelease(options.fetchImpl);
  if (!latest) return null;
  if (
    !shouldNotifyUpdate(
      options.localVersion,
      latest.tagName,
      options.dismissedVersion,
    )
  ) {
    return null;
  }
  const parsed = parseSemver(latest.tagName);
  if (!parsed) return null;
  return {
    localVersion: options.localVersion,
    remoteVersion: `${parsed.major}.${parsed.minor}.${parsed.patch}`,
    releaseUrl: latest.htmlUrl,
  };
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- src/lib/updateCheck.test.ts src/lib/semver.test.ts`  
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/repo.ts src/lib/updateCheck.ts src/lib/updateCheck.test.ts
git commit -m "feat: check GitHub latest release for updates"
```

---

### Task 3: Tauri CSP + opener allowlist for GitHub

**Files:**
- Modify: `src-tauri/tauri.conf.json` (CSP `connect-src`)
- Modify: `src-tauri/capabilities/default.json` (opener permissions if needed)

**Interfaces:**
- Consumes: none
- Produces: webview can `fetch` `https://api.github.com`; opener can open `https://github.com/...`

- [ ] **Step 1: Update CSP in `src-tauri/tauri.conf.json`**

Current `csp` string includes `connect-src ipc: http://ipc.localhost`. Change `connect-src` to also allow GitHub API:

```
connect-src ipc: http://ipc.localhost https://api.github.com
```

Keep existing `img-src`, `style-src`, `script-src`, `default-src` unchanged.

- [ ] **Step 2: Ensure opener can open GitHub release pages**

In `src-tauri/capabilities/default.json`, replace bare `"opener:default"` with an allowlist entry if the plugin requires URLs (Tauri 2 opener):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "sql:default",
    "sql:allow-execute",
    {
      "identifier": "opener:allow-open-url",
      "allow": [
        { "url": "https://github.com/SirSoto25/forzaLapTracker/releases" },
        { "url": "https://github.com/SirSoto25/forzaLapTracker/releases/*" }
      ]
    },
    "opener:allow-default-urls"
  ]
}
```

If `opener:default` already permits https URLs in this project version, keep `"opener:default"` and only add the CSP change. Prefer the minimal change that allows opening the release `html_url`.

Verify against generated schema under `src-tauri/gen/schemas/` if present after `tauri build`/`dev`.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/tauri.conf.json src-tauri/capabilities/default.json
git commit -m "chore: allow GitHub API and release URLs for update notice"
```

---

### Task 4: UpdateBanner UI + App boot wiring

**Files:**
- Create: `src/components/UpdateBanner.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/i18n/es.json`
- Modify: `src/i18n/en.json`

**Interfaces:**
- Consumes: `checkForAppUpdate`, `getSetting`/`setSetting`, `getVersion` from `@tauri-apps/api/app`, `openUrl` from `@tauri-apps/plugin-opener`
- Produces: banner visible when update available; setting key `update_dismissed_version`

- [ ] **Step 1: Add i18n keys**

`es.json`:
```json
"update.available": "Nueva versión disponible: v{version}",
"update.view": "Ver descarga",
"update.dismiss": "Ahora no",
"update.dismissVersion": "No avisar de esta versión",
"update.checking": "Comprobando actualizaciones…",
"update.upToDate": "Estás al día (v{version})",
"update.checkFailed": "No se pudo comprobar actualizaciones",
"update.check": "Comprobar actualizaciones"
```

`en.json`:
```json
"update.available": "New version available: v{version}",
"update.view": "View download",
"update.dismiss": "Not now",
"update.dismissVersion": "Don't notify for this version",
"update.checking": "Checking for updates…",
"update.upToDate": "You're up to date (v{version})",
"update.checkFailed": "Could not check for updates",
"update.check": "Check for updates"
```

Extend `t()` usage: for placeholders, add a tiny helper in the component:

```ts
function tf(key: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, v),
    t(key),
  );
}
```

(Keep it local to the component/settings — do not overhaul i18n.)

- [ ] **Step 2: Create `UpdateBanner.tsx`**

```tsx
import { openUrl } from "@tauri-apps/plugin-opener";
import { t } from "../i18n";
import type { UpdateInfo } from "../lib/updateCheck";

type Props = {
  info: UpdateInfo;
  onDismissSession: () => void;
  onDismissVersion: () => void;
};

function tf(key: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, v),
    t(key),
  );
}

export function UpdateBanner({
  info,
  onDismissSession,
  onDismissVersion,
}: Props) {
  return (
    <div className="update-banner" role="status">
      <p>{tf("update.available", { version: info.remoteVersion })}</p>
      <div className="update-banner-actions">
        <button
          type="button"
          onClick={() => void openUrl(info.releaseUrl)}
        >
          {t("update.view")}
        </button>
        <button type="button" className="ghost" onClick={onDismissSession}>
          {t("update.dismiss")}
        </button>
        <button type="button" className="ghost" onClick={onDismissVersion}>
          {t("update.dismissVersion")}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire into `App.tsx` after boot ready**

Add state `updateInfo: UpdateInfo | null` and `updateDismissedSession`. After `bootState === "ready"`, in a `useEffect`:

```ts
void (async () => {
  try {
    const [{ getVersion }, { checkForAppUpdate }, { getSetting }] =
      await Promise.all([
        import("@tauri-apps/api/app"),
        import("./lib/updateCheck"),
        import("./lib/api"),
      ]);
    const localVersion = await getVersion();
    const dismissed = await getSetting("update_dismissed_version");
    const info = await checkForAppUpdate({
      localVersion,
      dismissedVersion: dismissed,
    });
    if (info) setUpdateInfo(info);
  } catch {
    // silent
  }
})();
```

Render above `<main>` (or top of shell):

```tsx
{updateInfo && !updateDismissedSession ? (
  <UpdateBanner
    info={updateInfo}
    onDismissSession={() => setUpdateDismissedSession(true)}
    onDismissVersion={() => {
      void setSetting("update_dismissed_version", updateInfo.remoteVersion);
      setUpdateInfo(null);
    }}
  />
) : null}
```

Import `setSetting` from `./lib/api` statically with other imports if cleaner.

- [ ] **Step 4: CSS for `.update-banner` / `.update-banner-actions`**

Match existing dark shell (`#191f26` / accent `#f4b942`). Full-width bar under header or above main content; compact padding; flex actions wrap.

- [ ] **Step 5: Run unit tests**

Run: `npm test`  
Expected: all PASS (existing + new)

- [ ] **Step 6: Commit**

```bash
git add src/components/UpdateBanner.tsx src/App.tsx src/App.css src/i18n/es.json src/i18n/en.json
git commit -m "feat: show in-app banner when a newer GitHub release exists"
```

---

### Task 5: Settings — manual update check

**Files:**
- Modify: `src/pages/SettingsPage.tsx`
- i18n keys already added in Task 4

**Interfaces:**
- Consumes: `checkForAppUpdate`, `getVersion`, `getSetting`, `setSetting`, `UpdateBanner` optional inline status text
- Produces: button that reports up-to-date / available / failed

- [ ] **Step 1: Extend SettingsPage**

Add local state `status: "idle" | "checking" | "upToDate" | "available" | "failed"` and `manualInfo: UpdateInfo | null`.

Button `update.check` runs:

```ts
setStatus("checking");
try {
  const localVersion = await getVersion();
  const dismissed = await getSetting("update_dismissed_version");
  const info = await checkForAppUpdate({ localVersion, dismissedVersion: dismissed });
  if (info) {
    setManualInfo(info);
    setStatus("available");
  } else {
    setManualInfo(null);
    setStatus("upToDate");
    // optional: still show local version via getVersion in message
  }
} catch {
  setStatus("failed");
}
```

When `available`, reuse `UpdateBanner` or compact actions (open URL / dismiss version).

Show muted status line for checking / upToDate / failed using `tf` with `{version}`.

- [ ] **Step 2: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "feat: add manual update check in settings"
```

---

### Task 6: GitHub Actions release workflow

**Files:**
- Create: `.github/workflows/release.yml`
- Modify: `src-tauri/tauri.conf.json` bundle targets if needed (prefer CLI `--bundles` in workflow)

**Interfaces:**
- Consumes: project builds via `npm ci` + Tauri
- Produces: GitHub Release with MSI, NSIS exe, deb, AppImage

- [ ] **Step 1: Create `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    tags:
      - "v*"
  workflow_dispatch:
    inputs:
      tag:
        description: "Release tag (e.g. v0.1.1). Leave empty to use package.json version."
        required: false
        type: string

permissions:
  contents: write

jobs:
  publish:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: windows-latest
            bundles: msi,nsis
          - platform: ubuntu-22.04
            bundles: deb,appimage

    runs-on: ${{ matrix.platform }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Resolve tag
        id: tag
        shell: bash
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            INPUT="${{ inputs.tag }}"
            if [ -n "$INPUT" ]; then
              echo "name=$INPUT" >> "$GITHUB_OUTPUT"
            else
              VER=$(node -p "require('./package.json').version")
              echo "name=v${VER}" >> "$GITHUB_OUTPUT"
            fi
          else
            echo "name=${GITHUB_REF_NAME}" >> "$GITHUB_OUTPUT"
          fi

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable

      - name: Linux dependencies
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - name: Install frontend dependencies
        run: npm ci

      - name: Build and publish
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ steps.tag.outputs.name }}
          releaseName: Forza Lap Tracker ${{ steps.tag.outputs.name }}
          releaseBody: |
            Download the installer for your platform from the assets below.

            - **Windows:** `.msi` (WiX) or `-setup.exe` (NSIS)
            - **Linux:** `.deb` or `.AppImage`
          releaseDraft: false
          prerelease: false
          args: --bundles ${{ matrix.bundles }}
```

Notes for the implementer:
- If `tauri-action@v0` warns about tag creation on `workflow_dispatch`, ensure the action creates the tag/release when missing (default behavior of tauri-action when `tagName` is set).
- Confirm `__VERSION__` is **not** required if `tagName` is an explicit `vX.Y.Z`; using explicit tag from the Resolve step is preferred.
- Keep `package.json` and `src-tauri/tauri.conf.json` versions in sync before tagging (document in Task 7).

- [ ] **Step 2: Optionally pin `bundle.targets` in `tauri.conf.json`**

If current `"targets": "all"` is fine with `--bundles` override, leave as-is. Do not add macOS-only config.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: publish Windows and Linux installers to GitHub Releases"
```

---

### Task 7: README release docs

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a Releases section** after Development

Content to include:
- Link: `https://github.com/SirSoto25/forzaLapTracker/releases`
- Assets: Windows MSI / NSIS setup; Linux deb / AppImage
- How to cut a release:
  1. Bump `version` in `package.json` and `src-tauri/tauri.conf.json` (and `src-tauri/Cargo.toml` package version if it differs)
  2. Commit on `main`
  3. `git tag vX.Y.Z && git push origin vX.Y.Z` **or** Actions → Release → Run workflow
- Note: app shows an in-app notice when a newer release exists (link only; unsigned Windows may SmartScreen)
- Note: Linux builds target Ubuntu 22.04 glibc

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: explain GitHub Releases and update notice"
```

---

### Task 8: Verification + graphify

**Files:**
- Possibly none beyond graphify outputs if the project tracks them

- [ ] **Step 1: Run full test + typecheck**

```bash
npm test
npx tsc --noEmit
```

Expected: PASS / exit 0

- [ ] **Step 2: Update knowledge graph**

```bash
graphify update .
```

- [ ] **Step 3: Commit graphify artifacts if tracked**

```bash
git add graphify-out/GRAPH_REPORT.md graphify-out/graph.json graphify-out/manifest.json
git commit -m "chore: refresh graphify after releases workflow"
```

(Skip if no meaningful diff.)

- [ ] **Step 4: Manual smoke (local)**

1. `npm run tauri dev` — app boots; with no newer release, no banner (or mock by temporarily hardcoding localVersion `"0.0.1"` in the App effect for a one-off check, then revert).
2. Settings → Check for updates shows up-to-date or available.
3. After merge: run workflow_dispatch or push `v0.1.1` and confirm four asset types appear on the Release.

---

## Spec coverage checklist

| Spec item | Task |
| --- | --- |
| Tag `v*` + workflow_dispatch | 6 |
| Windows MSI + NSIS | 6 |
| Linux deb + AppImage | 6 |
| Published release (`draft: false`) | 6 |
| Boot check + silent failure | 4 |
| Settings manual check | 5 |
| Open release URL via opener | 4 / 3 |
| Dismiss session / dismiss version setting | 4 |
| CSP / capabilities | 3 |
| README | 7 |
| Semver compare | 1–2 |
| No updater plugin / no signing | honored (not implemented) |

## Placeholder / consistency self-review

- Setting key fixed: `update_dismissed_version`
- Types fixed: `UpdateInfo`, `shouldNotifyUpdate`, `checkForAppUpdate`
- Opener permission block may need trimming to match actual Tauri 2 schema — Task 3 says prefer minimal working config
- No TBD / “add tests later” left in tasks
