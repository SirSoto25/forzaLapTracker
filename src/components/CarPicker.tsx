import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Car, Manufacturer } from "../db/types";
import { t } from "../i18n";
import { createCar, ensureCarImage, listCars, listManufacturers } from "../lib/api";
import { assetUrl } from "../lib/assets";

type CarPickerProps = {
  carId: number | null;
  onChange: (carId: number | null) => void;
  required?: boolean;
};

export function CarPicker({
  carId,
  onChange,
  required = true,
}: CarPickerProps) {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [manufacturerId, setManufacturerId] = useState<number | null>(null);
  const [brandQuery, setBrandQuery] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  const [newModel, setNewModel] = useState("");
  const [addingModel, setAddingModel] = useState(false);
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
    if (carId === null || manufacturers.length === 0) return;
    let active = true;
    void listCars()
      .then((all) => {
        if (!active) return;
        const selected = all.find((c) => c.id === carId);
        if (!selected) return;
        setManufacturerId(selected.manufacturer_id);
        setThumbPath(selected.image_path);
        const brand = manufacturers.find(
          (m) => m.id === selected.manufacturer_id,
        );
        if (brand) setBrandQuery(brand.name);
        setModelQuery(selected.model);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [carId, manufacturers]);

  const filteredManufacturers = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return manufacturers;
    return manufacturers.filter((m) => m.name.toLowerCase().includes(q));
  }, [manufacturers, brandQuery]);

  const filteredCars = useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((c) => c.model.toLowerCase().includes(q));
  }, [cars, modelQuery]);

  async function selectManufacturer(id: number) {
    setError(null);
    setManufacturerId(id);
    setNewModel("");
    setAddingModel(false);
    setModelQuery("");
    setThumbPath(null);
    onChange(null);
    const brand = manufacturers.find((m) => m.id === id);
    if (brand) setBrandQuery(brand.name);
  }

  async function selectCar(id: number) {
    setError(null);
    carIdRef.current = id;
    onChange(id);
    const car = cars.find((c) => c.id === id);
    if (car) setModelQuery(car.model);
    setThumbPath(car?.image_path ?? null);
    const path = await ensureCarImage(id);
    if (path && carIdRef.current === id) setThumbPath(path);
  }

  async function onAddCar(event: FormEvent) {
    event.preventDefault();
    if (manufacturerId === null) return;
    setError(null);
    try {
      const id = await createCar(manufacturerId, newModel);
      setNewModel("");
      setAddingModel(false);
      const rows = await listCars(manufacturerId);
      setCars(rows);
      await selectCar(id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const selectedManufacturer =
    manufacturers.find((m) => m.id === manufacturerId) ?? null;
  const selectedCar = cars.find((c) => c.id === carId) ?? null;
  const thumbUrl = assetUrl(thumbPath);
  const brandIcon = assetUrl(selectedManufacturer?.icon_path);

  return (
    <div className="car-picker">
      <label className="car-picker-search">
        <span>{t("register.manufacturer")}</span>
        <input
          value={brandQuery}
          onChange={(e) => {
            setBrandQuery(e.target.value);
            if (manufacturerId !== null) {
              const current = manufacturers.find((m) => m.id === manufacturerId);
              if (
                current &&
                !current.name
                  .toLowerCase()
                  .includes(e.target.value.trim().toLowerCase())
              ) {
                setManufacturerId(null);
                onChange(null);
                setCars([]);
                setThumbPath(null);
              }
            }
          }}
          placeholder={t("register.searchBrand")}
          autoComplete="off"
        />
      </label>

      <div className="car-picker-brand-grid" role="listbox">
        {filteredManufacturers.slice(0, 24).map((m) => {
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
              {icon ? <img src={icon} alt="" width={28} height={28} /> : null}
              <span>{m.name}</span>
            </button>
          );
        })}
        {filteredManufacturers.length === 0 ? (
          <p className="muted">{t("register.noBrandMatch")}</p>
        ) : null}
        {filteredManufacturers.length > 24 ? (
          <p className="muted">
            {t("register.refineBrand")} ({filteredManufacturers.length})
          </p>
        ) : null}
      </div>

      {manufacturerId !== null ? (
        <>
          <label className="car-picker-search">
            <span>{t("register.model")}</span>
            <input
              value={modelQuery}
              onChange={(e) => setModelQuery(e.target.value)}
              placeholder={t("register.searchModel")}
              autoComplete="off"
            />
          </label>

          <label className="car-picker-model">
            <span className="sr-only">{t("register.selectCar")}</span>
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
              size={Math.min(8, Math.max(3, filteredCars.length || 3))}
            >
              <option value="">{t("register.selectCar")}</option>
              {filteredCars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.model}
                </option>
              ))}
            </select>
          </label>

          {!addingModel ? (
            <button
              type="button"
              className="linkish"
              onClick={() => setAddingModel(true)}
            >
              {t("register.addCar")}
            </button>
          ) : (
            <form className="car-picker-add" onSubmit={(e) => void onAddCar(e)}>
              <label>
                <span className="sr-only">{t("register.addCar")}</span>
                <input
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder={t("register.modelPlaceholder")}
                  required
                  autoFocus
                />
              </label>
              <button type="submit">{t("register.saveCar")}</button>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setAddingModel(false);
                  setNewModel("");
                }}
              >
                {t("common.cancel")}
              </button>
            </form>
          )}
        </>
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
