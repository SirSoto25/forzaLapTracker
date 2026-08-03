import { compareSemver, parseSemver } from "./semver";
import { githubReleasesLatestApiUrl } from "./repo";

export type UpdateInfo = {
  localVersion: string;
  remoteVersion: string;
  releaseUrl: string;
};

export type UpdateCheckResult =
  | { status: "available"; info: UpdateInfo }
  | { status: "upToDate" }
  | { status: "failed" };

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
}): Promise<UpdateCheckResult> {
  const latest = await fetchLatestRelease(options.fetchImpl);
  if (!latest) return { status: "failed" };
  if (
    !shouldNotifyUpdate(
      options.localVersion,
      latest.tagName,
      options.dismissedVersion,
    )
  ) {
    return { status: "upToDate" };
  }
  const parsed = parseSemver(latest.tagName);
  if (!parsed) return { status: "failed" };
  return {
    status: "available",
    info: {
      localVersion: options.localVersion,
      remoteVersion: `${parsed.major}.${parsed.minor}.${parsed.patch}`,
      releaseUrl: latest.htmlUrl,
    },
  };
}
