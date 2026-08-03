import { useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { Car, Manufacturer } from "../db/types";
import { t } from "../i18n";
import { ensureCarImage, listCars, listManufacturers } from "../lib/api";

type CarPickerProps = {
  carId: number | null;
  onChange: (carId: number | null) => void;
  required?: boolean;
};

/** Relative public assets stay as `/…`; absolute app-data paths use asset protocol. */
function assetUrl(path: string | null | undefined): string | null {
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

export function CarPicker({
  carId,
  onChange,
  required = true,
}: CarPickerProps) {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [manufacturerId, setManufacturerId] = useState<number | null>(null);
  const [thumbPath, setThumbPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const carIdRef = useRef(carId);

  useEffect(() => {
    carIdRef.current = carId;
  }, [carId]);

  useEffect(() => {
    void listManufacturers()
      .then(setManufacturers)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  useEffect(() => {
    if (manufacturerId === null) {
      setCars([]);
      return;
    }
    let active = true;
    void listCars(manufacturerId)
      .then((rows) => {
        if (active) setCars(rows);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      active = false;
    };
  }, [manufacturerId]);

  useEffect(() => {
    if (carId === null || cars.length === 0) return;
    const selected = cars.find((c) => c.id === carId);
    if (selected) {
      setManufacturerId(selected.manufacturer_id);
      setThumbPath(selected.image_path);
    }
  }, [carId, cars]);

  async function selectManufacturer(id: number) {
    setError(null);
    setManufacturerId(id);
    setThumbPath(null);
    onChange(null);
  }

  async function selectCar(id: number) {
    setError(null);
    carIdRef.current = id;
    onChange(id);
    const car = cars.find((c) => c.id === id);
    setThumbPath(car?.image_path ?? null);
    // Download is best-effort; null → placeholder. Never blocks lap save.
    const path = await ensureCarImage(id);
    if (path && carIdRef.current === id) setThumbPath(path);
  }

  const selectedManufacturer =
    manufacturers.find((m) => m.id === manufacturerId) ?? null;
  const selectedCar = cars.find((c) => c.id === carId) ?? null;
  const thumbUrl = assetUrl(thumbPath);
  const brandIcon = assetUrl(selectedManufacturer?.icon_path);

  return (
    <div className="car-picker">
      <fieldset className="car-picker-brands">
        <legend>{t("register.manufacturer")}</legend>
        <div className="car-picker-brand-grid" role="listbox">
          {manufacturers.map((m) => {
            const icon = assetUrl(m.icon_path);
            return (
              <button
                key={m.id}
                type="button"
                className={manufacturerId === m.id ? "active" : ""}
                aria-selected={manufacturerId === m.id}
                title={m.name}
                onClick={() => void selectManufacturer(m.id)}
              >
                {icon ? (
                  <img src={icon} alt="" width={28} height={28} />
                ) : null}
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {manufacturerId !== null ? (
        <label className="car-picker-model">
          <span>{t("register.model")}</span>
          <select
            value={carId ?? ""}
            onChange={(e) => {
              const next = e.target.value;
              if (!next) {
                onChange(null);
                setThumbPath(null);
                return;
              }
              void selectCar(Number(next));
            }}
            required={required}
          >
            <option value="">{t("register.selectCar")}</option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.model}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {selectedCar ? (
        <div className="car-picker-preview">
          {thumbUrl ? (
            <img src={thumbUrl} alt="" className="car-thumb" />
          ) : (
            <div className="car-thumb placeholder" aria-hidden>
              {brandIcon ? (
                <img src={brandIcon} alt="" width={32} height={32} />
              ) : (
                selectedManufacturer?.name.slice(0, 1) ?? "?"
              )}
            </div>
          )}
          <p>
            {selectedManufacturer?.name} {selectedCar.model}
          </p>
        </div>
      ) : null}

      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  );
}
