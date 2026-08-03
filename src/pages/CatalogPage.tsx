import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Car, Circuit, Manufacturer } from "../db/types";
import { t } from "../i18n";
import {
  createCar,
  createCircuit,
  createManufacturer,
  deleteCar,
  deleteCircuit,
  deleteManufacturer,
  listCars,
  listCircuits,
  listManufacturers,
  updateCar,
  updateCircuit,
  updateManufacturer,
} from "../lib/api";
import { assetUrl } from "../lib/assets";

type Tab = "manufacturers" | "cars" | "circuits";

export function CatalogPage() {
  const [tab, setTab] = useState<Tab>("manufacturers");
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [mName, setMName] = useState("");
  const [editManufacturerId, setEditManufacturerId] = useState<number | null>(
    null,
  );

  const [carManufacturerId, setCarManufacturerId] = useState<number | "">("");
  const [carModel, setCarModel] = useState("");
  const [editCarId, setEditCarId] = useState<number | null>(null);

  const [circuitName, setCircuitName] = useState("");
  const [editCircuitId, setEditCircuitId] = useState<number | null>(null);

  async function refresh() {
    const [m, c, circ] = await Promise.all([
      listManufacturers(),
      listCars(),
      listCircuits(),
    ]);
    setManufacturers(m);
    setCars(c);
    setCircuits(circ);
    if (carManufacturerId === "" && m[0]) setCarManufacturerId(m[0].id);
  }

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : String(err));
    });
  }, []);

  const filteredManufacturers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return manufacturers;
    return manufacturers.filter((m) => m.name.toLowerCase().includes(q));
  }, [manufacturers, query]);

  const filteredCars = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter(
      (c) =>
        c.model.toLowerCase().includes(q) ||
        (c.manufacturer_name ?? "").toLowerCase().includes(q),
    );
  }, [cars, query]);

  const filteredCircuits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return circuits;
    return circuits.filter((c) => c.name.toLowerCase().includes(q));
  }, [circuits, query]);

  function clearFlash() {
    setError(null);
    setMessage(null);
  }

  async function onSaveManufacturer(event: FormEvent) {
    event.preventDefault();
    clearFlash();
    try {
      if (editManufacturerId === null) {
        await createManufacturer(mName);
        setMessage(t("catalog.created"));
      } else {
        await updateManufacturer(editManufacturerId, { name: mName });
        setMessage(t("catalog.updated"));
      }
      setMName("");
      setEditManufacturerId(null);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onSaveCar(event: FormEvent) {
    event.preventDefault();
    clearFlash();
    if (carManufacturerId === "") {
      setError(t("catalog.pickManufacturer"));
      return;
    }
    try {
      if (editCarId === null) {
        await createCar(carManufacturerId, carModel);
        setMessage(t("catalog.created"));
      } else {
        await updateCar(editCarId, {
          model: carModel,
          manufacturerId: carManufacturerId,
        });
        setMessage(t("catalog.updated"));
      }
      setCarModel("");
      setEditCarId(null);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onSaveCircuit(event: FormEvent) {
    event.preventDefault();
    clearFlash();
    try {
      if (editCircuitId === null) {
        await createCircuit(circuitName);
        setMessage(t("catalog.created"));
      } else {
        await updateCircuit(editCircuitId, circuitName);
        setMessage(t("catalog.updated"));
      }
      setCircuitName("");
      setEditCircuitId(null);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onDeleteManufacturer(id: number) {
    clearFlash();
    if (!window.confirm(t("catalog.confirmDelete"))) return;
    try {
      await deleteManufacturer(id);
      if (editManufacturerId === id) {
        setEditManufacturerId(null);
        setMName("");
      }
      setMessage(t("catalog.deleted"));
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onDeleteCar(id: number) {
    clearFlash();
    if (!window.confirm(t("catalog.confirmDelete"))) return;
    try {
      await deleteCar(id);
      if (editCarId === id) {
        setEditCarId(null);
        setCarModel("");
      }
      setMessage(t("catalog.deleted"));
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onDeleteCircuit(id: number) {
    clearFlash();
    if (!window.confirm(t("catalog.confirmDelete"))) return;
    try {
      await deleteCircuit(id);
      if (editCircuitId === id) {
        setEditCircuitId(null);
        setCircuitName("");
      }
      setMessage(t("catalog.deleted"));
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="page">
      <p className="eyebrow">{t("nav.catalog")}</p>
      <h2>{t("page.catalog.title")}</h2>
      <p className="muted">{t("page.catalog.subtitle")}</p>

      <div className="catalog-tabs" role="tablist">
        {(
          [
            ["manufacturers", "catalog.tab.manufacturers"],
            ["cars", "catalog.tab.cars"],
            ["circuits", "catalog.tab.circuits"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => {
              setTab(id);
              setQuery("");
              clearFlash();
            }}
          >
            {t(label)}
          </button>
        ))}
      </div>

      <label className="catalog-search">
        <span className="sr-only">{t("catalog.search")}</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("catalog.search")}
        />
      </label>

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      {tab === "manufacturers" ? (
        <>
          <form className="catalog-form" onSubmit={(e) => void onSaveManufacturer(e)}>
            <label>
              <span>{t("catalog.manufacturerName")}</span>
              <input
                value={mName}
                onChange={(e) => setMName(e.target.value)}
                required
              />
            </label>
            <button type="submit">
              {editManufacturerId === null
                ? t("catalog.create")
                : t("catalog.save")}
            </button>
            {editManufacturerId !== null ? (
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setEditManufacturerId(null);
                  setMName("");
                }}
              >
                {t("common.cancel")}
              </button>
            ) : null}
          </form>

          <ul className="catalog-list">
            {filteredManufacturers.map((m) => {
              const icon = assetUrl(m.icon_path);
              return (
                <li key={m.id}>
                  <div className="catalog-row">
                    {icon ? (
                      <img src={icon} alt="" width={28} height={28} />
                    ) : null}
                    <span>{m.name}</span>
                    <span className="circuit-kind">
                      {m.is_builtin
                        ? t("circuits.builtin")
                        : t("circuits.custom")}
                    </span>
                  </div>
                  <div className="catalog-row-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setEditManufacturerId(m.id);
                        setMName(m.name);
                      }}
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => void onDeleteManufacturer(m.id)}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {tab === "cars" ? (
        <>
          <form className="catalog-form" onSubmit={(e) => void onSaveCar(e)}>
            <label>
              <span>{t("register.manufacturer")}</span>
              <select
                value={carManufacturerId}
                onChange={(e) =>
                  setCarManufacturerId(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                required
              >
                <option value="">{t("catalog.pickManufacturer")}</option>
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("register.model")}</span>
              <input
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                required
              />
            </label>
            <button type="submit">
              {editCarId === null ? t("catalog.create") : t("catalog.save")}
            </button>
            {editCarId !== null ? (
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setEditCarId(null);
                  setCarModel("");
                }}
              >
                {t("common.cancel")}
              </button>
            ) : null}
          </form>

          <ul className="catalog-list">
            {filteredCars.map((car) => (
              <li key={car.id}>
                <div className="catalog-row">
                  <span>
                    {car.manufacturer_name} {car.model}
                  </span>
                  <span className="circuit-kind">
                    {car.is_builtin
                      ? t("circuits.builtin")
                      : t("circuits.custom")}
                  </span>
                </div>
                <div className="catalog-row-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditCarId(car.id);
                      setCarModel(car.model);
                      setCarManufacturerId(car.manufacturer_id);
                    }}
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => void onDeleteCar(car.id)}
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {tab === "circuits" ? (
        <>
          <form className="catalog-form" onSubmit={(e) => void onSaveCircuit(e)}>
            <label>
              <span>{t("circuits.name")}</span>
              <input
                value={circuitName}
                onChange={(e) => setCircuitName(e.target.value)}
                required
              />
            </label>
            <button type="submit">
              {editCircuitId === null ? t("catalog.create") : t("catalog.save")}
            </button>
            {editCircuitId !== null ? (
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setEditCircuitId(null);
                  setCircuitName("");
                }}
              >
                {t("common.cancel")}
              </button>
            ) : null}
          </form>

          <ul className="catalog-list">
            {filteredCircuits.map((circuit) => (
              <li key={circuit.id}>
                <div className="catalog-row">
                  <span>{circuit.name}</span>
                  <span className="circuit-kind">
                    {circuit.is_builtin
                      ? t("circuits.builtin")
                      : t("circuits.custom")}
                  </span>
                </div>
                <div className="catalog-row-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditCircuitId(circuit.id);
                      setCircuitName(circuit.name);
                    }}
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => void onDeleteCircuit(circuit.id)}
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
