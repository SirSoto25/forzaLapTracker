#!/usr/bin/env python3
"""One-shot: re-scrape cars only (logos/circuits already written)."""
from __future__ import annotations

import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "seed"
UA = {"User-Agent": "Mozilla/5.0 (compatible; forzaLapTracker-seed/1.2)"}

manufacturers = json.loads((SEED / "manufacturers.json").read_text(encoding="utf-8"))

ACRONYMS = {
    "gr", "gt", "gtr", "rs", "ss", "sv", "svr", "trd", "srt", "amg", "bmw",
    "fx", "rx", "mx", "nsx", "zl1", "zr1", "tt", "ev", "fd",
}


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", "replace")


def title_from_slug(slug_tail: str) -> str:
    parts = slug_tail.split("-")
    out: list[str] = []
    for part in parts:
        if not part:
            continue
        if part.isdigit():
            out.append(part)
        elif part.lower() in ACRONYMS or (len(part) <= 3 and part.isalpha()):
            out.append(part.upper())
        else:
            out.append(part.capitalize())
    return " ".join(out)


def parse_make_cars(html: str, manufacturer_slug: str, manufacturer_name: str) -> list[dict]:
    cars: dict[str, dict] = {}

    # Prefer schema.org ListItem names when present
    for m in re.finditer(
        rf'"url"\s*:\s*"https?://forzagarage\.com/cars/({re.escape(manufacturer_slug)}-[a-z0-9-]+)/?"\s*,\s*"name"\s*:\s*"([^"]+)"',
        html,
        re.I,
    ):
        full_slug = m.group(1).lower()
        name = m.group(2).strip()
        # Drop leading year + brand if present: "2025 Toyota Land Cruiser"
        model = re.sub(r"^\d{4}\s+", "", name)
        brand_re = re.compile(rf"^{re.escape(manufacturer_name)}\s+", re.I)
        model = brand_re.sub("", model).strip()
        if model:
            cars[full_slug] = {
                "manufacturer_slug": manufacturer_slug,
                "model": model,
                "image_url": None,
            }

    # Fallback: any /cars/{slug}/ link
    for m in re.finditer(
        rf"/cars/({re.escape(manufacturer_slug)}-[a-z0-9-]+)/?",
        html,
        re.I,
    ):
        full_slug = m.group(1).lower()
        if full_slug in cars:
            continue
        tail = full_slug[len(manufacturer_slug) + 1 :]
        model = title_from_slug(tail)
        if not model:
            continue
        cars[full_slug] = {
            "manufacturer_slug": manufacturer_slug,
            "model": model,
            "image_url": None,
        }

    return list(cars.values())


def main() -> None:
    all_cars: list[dict] = []
    for m in manufacturers:
        slug = m["slug"]
        name = m["name"]
        url = f"https://forzagarage.com/makes/{slug}"
        try:
            html = fetch_text(url)
            cars = parse_make_cars(html, slug, name)
            print(f"  {slug}: {len(cars)} cars")
            all_cars.extend(cars)
        except Exception as exc:  # noqa: BLE001
            print(f"  {slug}: FAIL {exc}")
        time.sleep(0.1)

    uniq: dict[tuple[str, str], dict] = {}
    for car in all_cars:
        key = (car["manufacturer_slug"], car["model"].lower())
        uniq[key] = car
    cars_out = sorted(
        uniq.values(),
        key=lambda c: (c["manufacturer_slug"], c["model"].lower()),
    )
    (SEED / "cars.json").write_text(
        json.dumps(cars_out, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    meta_path = SEED / "meta.json"
    meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
    meta.update(
        {
            "cars": len(cars_out),
            "seed_version": 2,
            "source": "forzagarage.com + forza.labsgg.com",
        }
    )
    meta_path.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(cars_out)} cars")


if __name__ == "__main__":
    main()
