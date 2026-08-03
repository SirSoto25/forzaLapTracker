import { useEffect, useState, type FormEvent } from "react";
import { formatLapTime } from "../domain/lapTime";
import { t } from "../i18n";
import { bestLap, createCircuit, listCircuits } from "../lib/api";
import type { Circuit, Lap } from "../db/types";

type NavTarget = "register" | "history" | "compare";

type CircuitsPageProps = {
  onNavigate: (route: NavTarget, circuitId: number) => void;
};

export function CircuitsPage({ onNavigate }: CircuitsPageProps) {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [best, setBest] = useState<Lap | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setCircuits(await listCircuits());
  }

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : String(err));
    });
  }, []);

  useEffect(() => {
    if (selectedId === null) {
      setBest(undefined);
      return;
    }
    let active = true;
    const circuitId = selectedId;
    setBest(undefined);
    void bestLap(circuitId)
      .then((lap) => {
        if (active) setBest(lap);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setBest(null);
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const id = await createCircuit(name);
      setName("");
      await refresh();
      setSelectedId(id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const selected = circuits.find((c) => c.id === selectedId) ?? null;

  return (
    <section className="page">
      <p className="eyebrow">{t("nav.circuits")}</p>
      <h2>{t("page.circuits.title")}</h2>

      <form className="circuit-add" onSubmit={(e) => void onAdd(e)}>
        <label>
          <span>{t("circuits.name")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("circuits.namePlaceholder")}
            required
          />
        </label>
        <button type="submit">{t("circuits.add")}</button>
      </form>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <ul className="circuit-list">
        {circuits.map((circuit) => (
          <li key={circuit.id}>
            <button
              type="button"
              className={selectedId === circuit.id ? "active" : ""}
              aria-pressed={selectedId === circuit.id}
              onClick={() => setSelectedId(circuit.id)}
            >
              <span>{circuit.name}</span>
              <span className="circuit-kind">
                {circuit.is_builtin
                  ? t("circuits.builtin")
                  : t("circuits.custom")}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selected ? (
        <div className="circuit-summary">
          <h3>{selected.name}</h3>
          {best === undefined ? (
            <p className="muted">{t("circuits.loading")}</p>
          ) : best === null ? (
            <p className="muted">{t("circuits.noLaps")}</p>
          ) : (
            <p>
              <span className="muted">{t("circuits.bestLap")}: </span>
              <strong>{formatLapTime(best.time_ms)}</strong>
              {" — "}
              {[best.manufacturer_name, best.car_model]
                .filter(Boolean)
                .join(" ")}
            </p>
          )}
          <div className="circuit-actions">
            <button
              type="button"
              onClick={() => onNavigate("register", selected.id)}
            >
              {t("nav.register")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("history", selected.id)}
            >
              {t("nav.history")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("compare", selected.id)}
            >
              {t("nav.compare")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
