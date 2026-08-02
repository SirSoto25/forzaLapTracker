const RE = /^(\d{2}):([0-5]\d):(\d{3})$/;

export function parseLapTime(input: string): number {
  const m = RE.exec(input.trim());
  if (!m) throw new Error("Time must be mm:ss:mmm");
  const mm = Number(m[1]);
  const ss = Number(m[2]);
  const ms = Number(m[3]);
  return mm * 60_000 + ss * 1000 + ms;
}

export function formatLapTime(timeMs: number): string {
  if (!Number.isInteger(timeMs) || timeMs < 0) throw new Error("Invalid time_ms");
  const mm = Math.floor(timeMs / 60_000);
  const rem = timeMs % 60_000;
  const ss = Math.floor(rem / 1000);
  const ms = rem % 1000;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}:${String(ms).padStart(3, "0")}`;
}
