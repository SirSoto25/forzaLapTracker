import { useEffect, useState } from "react";
import { CarPicker } from "../components/CarPicker";
import type { Circuit, Lap, LapFilters } from "../db/types";
import { formatLapTime } from "../domain/lapTime";
import type { CarClass } from "../domain/piClass";
import { t } from "../i18n";
import { listCircuits, listLaps } from "../lib/api";

const CLASSES: CarClass[] = ["D", "C", "B", "A", "S1", "S2", "R", "X"];

type HistoryPageProps = {
  selectedCircuitId: number | null;
};

function formatRecordedDate(iso: string): string {
  const day = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : iso;
}

export function HistoryPage({ selectedCircuitId }: HistoryPageProps) {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [circuitId, setCircuitId] = useState<number | null>(selectedCircuitId);
  const [carId, setCarId] = useState<number | null>(null);
  const [carClass, setCarClass] = useState<CarClass | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<NonNullable<LapFilters["sort"]>>("date");
  const [laps, setLaps] = useState<Lap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listCircuits()
      .then(setCircuits)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  useEffect(() => {
    if (selectedCircuitId !== null) setCircuitId(selectedCircuitId);
  }, [selectedCircuitId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const filters: LapFilters = { sort };
    if (circuitId !== null) filters.circuitId = circuitId;
    if (carId !== null) filters.carId = carId;
    if (carClass !== "") filters.class = carClass;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    void listLaps(filters)
      .then((rows) => {
        if (!active) return;
        setLaps(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLaps([]);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [circuitId, carId, carClass, dateFrom, dateTo, sort]);

  return (
    <section className="page">
      <p className="eyebrow">{t("nav.history")}</p>
      <h2>{t("page.history.title")}</h2>

      <fieldset className="history-filters">
        <legend>{t("history.filters")}</legend>

        <label>
          <span>{t("register.circuit")}</span>
          <select
            value={circuitId ?? ""}
            onChange={(e) =>
              setCircuitId(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">{t("history.all")}</option>
            {circuits.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{t("register.class")}</span>
          <select
            value={carClass}
            onChange={(e) => setCarClass(e.target.value as CarClass | "")}
          >
            <option value="">{t("history.all")}</option>
            {CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </label>

        <div className="history-car-filter">
          <span className="field-label">{t("register.car")}</span>
          <CarPicker carId={carId} onChange={setCarId} required={false} />
        </div>

        <label>
          <span>{t("history.dateFrom")}</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>

        <label>
          <span>{t("history.dateTo")}</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>

        <label>
          <span>{t("history.sort")}</span>
          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value as NonNullable<LapFilters["sort"]>)
            }
          >
            <option value="time">{t("history.sortTime")}</option>
            <option value="date">{t("history.sortDate")}</option>
          </select>
        </label>
      </fieldset>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      {loading ? (
        <p className="muted">{t("history.loading")}</p>
      ) : laps.length === 0 ? (
        <p className="muted">{t("history.empty")}</p>
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>{t("history.col.date")}</th>
                <th>{t("register.circuit")}</th>
                <th>{t("register.car")}</th>
                <th>{t("register.pi")}</th>
                <th>{t("register.class")}</th>
                <th>{t("history.col.time")}</th>
              </tr>
            </thead>
            <tbody>
              {laps.map((lap) => (
                <tr key={lap.id}>
                  <td>{formatRecordedDate(lap.recorded_at)}</td>
                  <td>{lap.circuit_name ?? lap.circuit_id}</td>
                  <td>
                    {[lap.manufacturer_name, lap.car_model]
                      .filter(Boolean)
                      .join(" ") || lap.car_id}
                  </td>
                  <td>{lap.pi}</td>
                  <td>{lap.class}</td>
                  <td>
                    <time dateTime={`${lap.time_ms}ms`}>
                      {formatLapTime(lap.time_ms)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
