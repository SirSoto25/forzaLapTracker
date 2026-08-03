# Design: GitHub Releases + in-app update notice

**Date:** 2026-08-03  
**Status:** Approved  
**Repo:** https://github.com/SirSoto25/forzaLapTracker

## Goal

Ship downloadable installers from GitHub Releases (Windows MSI + NSIS `.exe`, Linux `.deb` + AppImage) and notify users in-app when a newer release exists, without auto-updating.

## Decisions (locked)

| Topic | Choice |
| --- | --- |
| Packaging | Windows: MSI + NSIS; Linux: deb + AppImage |
| Trigger | Tag `v*` **and** `workflow_dispatch` |
| Release visibility | Published automatically (`draft: false`) |
| In-app update UX | Notify only + link to Releases page |
| Signing / updater plugin | Out of scope for this work |
| macOS | Out of scope |

## Part 1 — CI release workflow

### File

`.github/workflows/release.yml`

### Triggers

1. `push` tags matching `v*` (e.g. `v0.1.1`)
2. `workflow_dispatch` with optional `tag` input (e.g. `v0.1.1`). If omitted, derive from `package.json` / `tauri.conf.json` version as `v{version}`.

### Jobs / matrix

| Runner | Bundle targets |
| --- | --- |
| `windows-latest` | `msi`, `nsis` |
| `ubuntu-22.04` | `deb`, `appimage` |

### Steps (each matrix cell)

1. `actions/checkout`
2. Node LTS + `npm ci`
3. `dtolnay/rust-toolchain@stable`
4. Ubuntu only: WebKitGTK 4.1 + usual Tauri Linux deps (`libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`, …)
5. `tauri-apps/tauri-action@v0` (or current stable major) with:
   - `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`
   - `tagName`: tag from event / input (`v__VERSION__` / explicit)
   - `releaseName`: `Forza Lap Tracker v__VERSION__`
   - `releaseBody`: short pointer to assets + changelog placeholder
   - `releaseDraft: false`
   - `prerelease: false` (unless tag contains `-` pre-release — optional future nicety; v1 can keep always false)
   - `args`: `--bundles msi,nsis` on Windows; `--bundles deb,appimage` on Linux

### Permissions

```yaml
permissions:
  contents: write
```

### Version alignment

- Prefer a single source of truth: bump `package.json` and `src-tauri/tauri.conf.json` (and Cargo package version if required by Tauri) **before** tagging.
- Document the release checklist in README (bump → commit → tag → push tag, or Actions → Run workflow).

### Failure behavior

- Failed matrix OS does not upload that platform’s artifacts; other OS may still succeed if jobs are independent. Prefer `fail-fast: false` so one platform failure does not cancel the other.

## Part 2 — In-app update notice

### Behavior

1. After successful DB boot (app ready), check for updates once per session (non-blocking).
2. Also expose a “Comprobar actualizaciones” control on Settings (optional but useful).
3. Fetch `GET https://api.github.com/repos/SirSoto25/forzaLapTracker/releases/latest` with a clear `User-Agent` (required by GitHub) and `Accept: application/vnd.github+json`.
4. Read local version via `@tauri-apps/api/app` `getVersion()`.
5. Compare semver (strip leading `v` from `tag_name`). If remote > local → show notice.
6. Notice content (i18n ES/EN):
   - Title/body with remote version
   - Primary: open release HTML URL in browser (`@tauri-apps/plugin-opener`)
   - Secondary: dismiss for this session
   - Optional: “No avisar de esta versión” → persist `update_dismissed_version` in `setting` table
7. Network / API / parse errors → silent (no toast error on boot). Settings manual check may show a short muted status.

### Non-goals

- Download installers inside the app
- Tauri updater plugin / signatures / `latest.json`
- Blocking the UI on boot

### Implementation sketch

- `src/lib/updateCheck.ts` — fetch + semver compare (pure helpers unit-tested)
- `src/components/UpdateBanner.tsx` (or inline in `App.tsx`) — presentational banner
- Wire into `App` after `bootState === "ready"`
- CSP / network: Tauri must allow HTTPS to `api.github.com` (and opener for `github.com`). Adjust `tauri.conf.json` CSP `connect-src` and capabilities if needed.
- Repo URL constant: `SirSoto25/forzaLapTracker` (or derive from config constant in one place).

### Semver rules

- Support `MAJOR.MINOR.PATCH` (+ optional prerelease later).
- Ignore drafts/prereleases if GitHub `latest` already excludes them (it does for non-prerelease latest).
- Equal versions → no banner.

## Part 3 — Docs

- README: **Releases** section — link to GitHub Releases, how to cut a release, which assets to download (Win MSI vs EXE, Linux deb vs AppImage).
- Brief note that the app notifies when a newer release exists.

## Testing

- Unit: semver compare + JSON parsing fixtures (mock `fetch`).
- Manual: tag/workflow produces four artifact types; install one; temporarily stub older local version or mock API to see banner; opener opens Releases page.
- CI workflow validates on a dry-run tag or first real `v0.1.x` after merge.

## Risks / notes

- Unsigned Windows builds may trigger SmartScreen; document as known limitation.
- GitHub API rate limits for unauthenticated requests are usually fine for single-user desktop apps; if abused, later add a static `latest.json` on the release.
- AppImage/deb need matching glibc of `ubuntu-22.04` — acceptable for MVP.
