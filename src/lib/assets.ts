import { convertFileSrc } from "@tauri-apps/api/core";

/** Relative public assets stay as `/…`; absolute app-data paths use asset protocol. */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const isAppData =
    /^[a-zA-Z]:[\\/]/.test(path) ||
    path.includes("images/cars") ||
    path.includes("images\\cars");
  if (isAppData) {
    try {
      return convertFileSrc(path);
    } catch {
      return path;
    }
  }
  return path.startsWith("/") ? path : `/${path}`;
}
