#!/usr/bin/env python3
"""Build FH6 seed JSON + download brand logos from forzagarage CDN."""
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "seed"
BRANDS_DIR = ROOT / "public" / "brands"
UA = {"User-Agent": "Mozilla/5.0 (compatible; forzaLapTracker-seed/1.1)"}

# Source: forzagarage.com/brands (87 makers, logo codes on R2)
BRANDS = [
    ("Abarth", "abarth", "ABA"),
    ("Acura", "acura", "ACU"),
    ("Alfa Romeo", "alfa-romeo", "ALF"),
    ("Alumicraft", "alumicraft", "AC"),
    ("AMG Transport Dynamics", "amg-transport-dynamics", "AMG"),
    ("Apollo", "apollo", "APO"),
    ("Ariel", "ariel", "ARI"),
    ("Aston Martin", "aston-martin", "AST"),
    ("Audi", "audi", "AUD"),
    ("Austin-Healey", "austin-healey", "AH"),
    ("Autozam", "autozam", "AZM"),
    ("BAC", "bac", "BAC"),
    ("Bentley", "bentley", "BEN"),
    ("BMW", "bmw", "BMW"),
    ("Buick", "buick", "BUI"),
    ("Cadillac", "cadillac", "CAD"),
    ("Can-Am", "can-am", "CAN"),
    ("Casey Currie Motorsports", "casey-currie-motorsports", "CCM"),
    ("Chevrolet", "chevrolet", "CHE"),
    ("Datsun", "datsun", "DAT"),
    ("DeBerti", "deberti", "DEB"),
    ("DeLorean", "delorean", "DEL"),
    ("Dodge", "dodge", "DOD"),
    ("Ferrari", "ferrari", "FER"),
    ("Ford", "ford", "FOR"),
    ("Formula Drift", "formula-drift", "FD"),
    ("Funco Motorsports", "funco-motorsports", "FUN"),
    ("GMC", "gmc", "GMC"),
    ("Gordon Murray Automotive", "gordon-murray-automotive", "GMA"),
    ("GR", "gr", "GR"),
    ("Hennessey", "hennessey", "HEN"),
    ("Holden", "holden", "HOL"),
    ("Honda", "honda", "HON"),
    ("HSV", "hsv", "HSV"),
    ("Hyundai", "hyundai", "HYU"),
    ("Jaguar", "jaguar", "JAG"),
    ("Jeep", "jeep", "JEE"),
    ("Jimco", "jimco", "JIM"),
    ("Koenigsegg", "koenigsegg", "KOE"),
    ("KTM", "ktm", "KTM"),
    ("Lamborghini", "lamborghini", "LAM"),
    ("Lancia", "lancia", "LAN"),
    ("Land Rover", "land-rover", "LR"),
    ("Lexus", "lexus", "LEX"),
    ("Lincoln", "lincoln", "LIN"),
    ("Lotus", "lotus", "LOT"),
    ("Lucid", "lucid", "LUC"),
    ("Maserati", "maserati", "MAS"),
    ("Mazda", "mazda", "MAZ"),
    ("McLaren", "mclaren", "MCL"),
    ("Mercedes-AMG", "mercedes-amg", "MA"),
    ("Mercedes-Benz", "mercedes-benz", "MER"),
    ("Meyers", "meyers", "MEY"),
    ("MG", "mg", "MG"),
    ("MINI", "mini", "MIN"),
    ("Mitsubishi", "mitsubishi", "MIT"),
    ("Nissan", "nissan", "NIS"),
    ("Noble", "noble", "NOB"),
    ("Opel", "opel", "OPE"),
    ("Pagani", "pagani", "PAG"),
    ("Peel", "peel", "PEE"),
    ("Penhall", "penhall", "PEN"),
    ("Peugeot", "peugeot", "PEU"),
    ("Plymouth", "plymouth", "PLY"),
    ("Polaris", "polaris", "POL"),
    ("Pontiac", "pontiac", "PON"),
    ("Porsche", "porsche", "POR"),
    ("Radical", "radical", "RAD"),
    ("Ram", "ram", "RAM"),
    ("Reliant", "reliant", "REL"),
    ("Renault", "renault", "REN"),
    ("Rimac", "rimac", "RIM"),
    ("RIVIAN", "rivian", "RIV"),
    ("RJ Anderson", "rj-anderson", "RJ"),
    ("Saleen", "saleen", "SAL"),
    ("Schuppan", "schuppan", "POR"),
    ("Shelby", "shelby", "SHE"),
    ("SIERRA Cars", "sierra-cars", "SIE"),
    ("SRT", "srt", "SRT"),
    ("Subaru", "subaru", "SUB"),
    ("Toyota", "toyota", "TOY"),
    ("TVR", "tvr", "TVR"),
    ("Ultima", "ultima", "ULT"),
    ("Volkswagen", "volkswagen", "VW"),
    ("Volvo", "volvo", "VOL"),
    ("Wuling", "wuling", "WUL"),
    ("Zenvo", "zenvo", "ZEN"),
]

LOGO_BASE = "https://pub-b1b0dda9cb0644008ffedffa8be50cbf.r2.dev/logos"

# FH6 Japan — forza.labsgg.com/all-race-tracks (festival + discover events)
CIRCUITS = [
    # Road / circuits
    "Coastline Sprint",
    "Daikoku Circuit",
    "Electric Town Circuit",
    "Festival Sprint",
    "Highway Circuit",
    "Hokubu Circuit",
    "Irokawa Circuit",
    "Ito Sprint",
    "Legend Island Circuit",
    "Narai-Juku Circuit",
    "Satta Sprint",
    "Seaside Park Sprint",
    "Sekibe Circuit",
    "Shikisai Sprint",
    "Shimanoyama Circuit",
    "Shimanoyama Drift Circuit",
    "Shimanoyama Sprint",
    "Shirakawa Circuit",
    "Soni Circuit",
    "Tateyama Kurobe Sprint",
    "The Colossus",
    "The Goliath",
    "Venus Sprint",
    # Street
    "Cedar Run Street Race",
    "Daikoku Chase Street Race",
    "Festival Chase Street Race",
    "Hokubu Ascent Street Race",
    "Kita Ine Street Race",
    "Matsumi Climb Street Race",
    "Minami Chase Street Race",
    "Nachi Run Street Race",
    "Norikura Descent Street Race",
    "Okishinaimura Run Street Race",
    "Rainbow Bridge Descent Street Race",
    "River Descent Street Race",
    "Shimanoyama Charge Street Race",
    "Sunflower Charge Street Race",
    "Tokyo City Docks Charge Street Race",
    # Touge
    "Arashiyama Takao Touge",
    "Bandai Azuma Touge",
    "Hakone Nanamagari Touge",
    "Mt. Haruna Touge",
    "Norikura Skyline Touge",
    # Drag
    "Horizon Festival Drag Strip",
    "Irokawa Space Center Drag Strip",
    "Ito Airfield Drag Strip",
    # Dirt
    "Airfield Trail",
    "Bamboo Forest Scramble",
    "Cherry Field Trail",
    "Chiheisen Scramble",
    "Hirosaki Scramble",
    "Hokubu Trail",
    "Horizon Stadium Scramble",
    "Ine Scramble",
    "Ito Trail",
    "Kawazu Nanadaru Scramble",
    "Kinkaku-ji Trail",
    "Legend Island Trail",
    "Nukabira Trail",
    "Oyashirazu Trail",
    "Sekibe Scramble",
    "Sotoyama Scramble",
    "Sunflower Scramble",
    "Taiyaki Scramble",
    "Takashiro Trail",
    "The Gauntlet",
    # Cross country
    "City Docks Cross Country Circuit",
    "Edogawa Cross Country Circuit",
    "Izu Cross Country",
    "Legend Island Cross Country Circuit",
    "Nangan Cross Country Circuit",
    "Naruo Cross Country Circuit",
    "Oka Cross Country Circuit",
    "Ruriko-ji Cross Country",
    "Shimanoyama Cross Country",
    "Shinjuku Gyoen Cross Country",
    "Snow Forest Cross Country Circuit",
    "Soni Highlands Cross Country",
    "Takashiro Cross Country",
    "Tateyama Alpine Cross Country",
    "Temple Cross Country",
    "The Titan",
    "Wind Farm Cross Country",
    "Yahikoyama Cross Country",
    # Wristband / showcase
    "Flight Club",
    "Horizon Invitational",
    "Horizon Legend",
    "Launch Control",
    "Mech My Day",
    "Off Piste",
    "Pier Pressure",
]

# Preserve known acronyms when title-casing slugs
ACRONYMS = {
    "gr",
    "gt",
    "gtr",
    "gt-r",
    "rs",
    "ss",
    "sv",
    "svr",
    "trd",
    "srt",
    "amg",
    "bmw",
    "fx",
    "rx",
    "mx",
    "nsx",
    "zl1",
    "zr1",
    "r8",
    "tt",
    "suv",
    "ev",
    "fd",
    "type",
}


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def fetch_text(url: str) -> str:
    return fetch(url).decode("utf-8", "replace")


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


def parse_make_cars(
    html: str, manufacturer_slug: str, manufacturer_name: str
) -> list[dict]:
    """Extract car models from forzagarage make page (JSON-LD + /cars/ links)."""
    cars: dict[str, dict] = {}

    for m in re.finditer(
        rf'"url"\s*:\s*"https?://forzagarage\.com/cars/({re.escape(manufacturer_slug)}-[a-z0-9-]+)/?"\s*,\s*"name"\s*:\s*"([^"]+)"',
        html,
        re.I,
    ):
        full_slug = m.group(1).lower()
        name = m.group(2).strip()
        model = re.sub(r"^\d{4}\s+", "", name)
        model = re.sub(
            rf"^{re.escape(manufacturer_name)}\s+", "", model, flags=re.I
        ).strip()
        if model:
            cars[full_slug] = {
                "manufacturer_slug": manufacturer_slug,
                "model": model,
                "image_url": None,
            }

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


def download_logo(code: str, slug: str) -> str:
    """Download webp logo; fallback to generated SVG. Returns public-relative path."""
    BRANDS_DIR.mkdir(parents=True, exist_ok=True)
    webp_path = BRANDS_DIR / f"{slug}.webp"
    svg_path = BRANDS_DIR / f"{slug}.svg"
    url = f"{LOGO_BASE}/{code}.webp"
    try:
        data = fetch(url)
        if len(data) < 200:
            raise ValueError(f"tiny response ({len(data)} bytes)")
        webp_path.write_bytes(data)
        return f"brands/{slug}.webp"
    except Exception as exc:  # noqa: BLE001
        print(f"  logo fail {slug} ({url}): {exc}")
        letters = "".join(ch for ch in slug.upper() if ch.isalnum())[:3] or "FH"
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#1a1a1a"/>
  <text x="32" y="38" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif"
    font-size="18" font-weight="700" fill="#f5f5f5">{letters}</text>
</svg>
"""
        svg_path.write_text(svg, encoding="utf-8")
        return f"brands/{slug}.svg"


def main() -> None:
    SEED.mkdir(parents=True, exist_ok=True)
    manufacturers = []
    print(f"Downloading {len(BRANDS)} brand logos…")
    for name, slug, code in BRANDS:
        icon = download_logo(code, slug)
        manufacturers.append({"name": name, "slug": slug, "icon": icon})
        time.sleep(0.04)

    (SEED / "manufacturers.json").write_text(
        json.dumps(manufacturers, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(manufacturers)} manufacturers")

    circuits = [{"name": name, "slug": slugify(name)} for name in CIRCUITS]
    (SEED / "circuits.json").write_text(
        json.dumps(circuits, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(circuits)} circuits")

    all_cars: list[dict] = []
    print("Fetching car models per brand…")
    for name, slug, _code in BRANDS:
        url = f"https://forzagarage.com/makes/{slug}"
        try:
            html = fetch_text(url)
            cars = parse_make_cars(html, slug, name)
            print(f"  {slug}: {len(cars)} cars")
            all_cars.extend(cars)
        except Exception as exc:  # noqa: BLE001
            print(f"  {slug}: FAIL {exc}")
        time.sleep(0.12)

    uniq: dict[tuple[str, str], dict] = {}
    for car in all_cars:
        key = (car["manufacturer_slug"], car["model"].lower())
        uniq[key] = car
    cars_out = list(uniq.values())
    cars_out.sort(key=lambda c: (c["manufacturer_slug"], c["model"].lower()))

    (SEED / "cars.json").write_text(
        json.dumps(cars_out, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(cars_out)} cars")
    meta = {
        "source": "forzagarage.com + forza.labsgg.com",
        "manufacturers": len(manufacturers),
        "cars": len(cars_out),
        "circuits": len(circuits),
        "seed_version": 2,
    }
    (SEED / "meta.json").write_text(
        json.dumps(meta, indent=2) + "\n", encoding="utf-8"
    )
    print("Done", meta)


if __name__ == "__main__":
    main()
