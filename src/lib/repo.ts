export const REPO_OWNER = "SirSoto25";
export const REPO_NAME = "forzaLapTracker";

export function githubReleasesLatestApiUrl(): string {
  return `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
}

export function githubReleasesPageUrl(): string {
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`;
}
