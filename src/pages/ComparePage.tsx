import { useEffect, useState } from "react";
import { CarPicker } from "../components/CarPicker";
import type { Circuit, Lap } from "../db/types";
import { bestDeltaMs } from "../domain/compare";
import { formatLapTime } from "../domain/lapTime";
import { t } from "../i18n";
import { bestLap, listCircuits, listLaps } from "../lib/api";

const RECENT_N = 5;

type ComparePageProps = {
  selectedCircuitId: number | null;
};

function formatRecordedDate(iso: string): string {
  const day = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : iso;
}

function deltaLabel(delta: number): string {
  if (delta < 0) return t("compare.aFaster");
  if (delta > 0) return t("compare.bFaster");
  return t("compare.tie");
}

function formatDelta(delta: number): string {
  if (delta === 0) return formatLapTime(0);
  const sign = delta < 0 ? "−" : "+";
  return `${sign}${formatLapTime(Math.abs(delta))}`;
}

export function ComparePage({ selectedCircuitId }: ComparePageProps) {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [circuitId, setCircuitId] = useState<number | null>(selectedCircuitId);
  const [carAId, setCarAId] = useState<number | null>(null);
  const [carBId, setCarBId] = useState<number | null>(null);
  const [bestA, setBestA] = useState<Lap | null>(null);
  const [bestB, setBestB] = useState<Lap | null>(null);
  const [recentA, setRecentA] = useState<Lap[]>([]);
  const [recentB, setRecentB] = useState<Lap[]>([]);
  const [loading, setLoading] = useState(false);
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
    if (circuitId === null || carAId === null || carBId === null) {
      setBestA(null);
      setBestB(null);
      setRecentA([]);
      setRecentB([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    void Promise.all([
      bestLap(circuitId, carAId),
      bestLap(circuitId, carBId),
      listLaps({ circuitId, carId: carAId, sort: "date" }),
      listLaps({ circuitId, carId: carBId, sort: "date" }),
    ])
      .then(([aBest, bBest, aLaps, bLaps]) => {
        if (!active) return;
        setBestA(aBest);
        setBestB(bBest);
        setRecentA(aLaps.slice(0, RECENT_N));
        setRecentB(bLaps.slice(0, RECENT_N));
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setBestA(null);
        setBestB(null);
        setRecentA([]);
        setRecentB([]);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [circuitId, carAId, carBId]);

  const ready = circuitId !== null && carAId !== null && carBId !== null;
  const delta =
    bestA !== null && bestB !== null
      ? bestDeltaMs(bestA.time_ms, bestB.time_ms)
      : null;

  return (
    <section className="page">
      <p className="eyebrow">{t("nav.compare")}</p>
      <h2>{t("page.compare.title")}</h2>

      <fieldset className="compare-filters">
        <legend>{t("compare.selectLaps")}</legend>

        <label>
          <span>{t("register.circuit")}</span>
          <select
            value={circuitId ?? ""}
            onChange={(e) =>
              setCircuitId(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">{t("register.selectCircuit")}</option>
            {circuits.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="compare-cars">
          <div className="compare-car">
            <span className="field-label">{t("compare.carA")}</span>
            <CarPicker carId={carAId} onChange={setCarAId} required={false} />
          </div>
          <div className="compare-car">
            <span className="field-label">{t("compare.carB")}</span>
            <CarPicker carId={carBId} onChange={setCarBId} required={false} />
          </div>
        </div>
      </fieldset>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      {!ready ? (
        <p className="muted">{t("compare.pickAll")}</p>
      ) : loading ? (
        <p className="muted">{t("compare.loading")}</p>
      ) : (
        <>
          <div className="compare-best">
            <div>
              <p className="field-label">{t("compare.carA")}</p>
              <p className="compare-time">
                {bestA ? (
                  <time dateTime={`${bestA.time_ms}ms`}>
                    {formatLapTime(bestA.time_ms)}
                  </time>
                ) : (
                  <span className="muted">{t("compare.noBest")}</span>
                )}
              </p>
              <p className="muted">{t("history.bestTime")}</p>
            </div>
            <div className="compare-delta">
              <p className="field-label">{t("compare.delta")}</p>
              {delta !== null ? (
                <>
                  <p className="compare-time">{formatDelta(delta)}</p>
                  <p className="compare-delta-label">{deltaLabel(delta)}</p>
                </>
              ) : (
                <p className="muted">{t("compare.noDelta")}</p>
              )}
            </div>
            <div>
              <p className="field-label">{t("compare.carB")}</p>
              <p className="compare-time">
                {bestB ? (
                  <time dateTime={`${bestB.time_ms}ms`}>
                    {formatLapTime(bestB.time_ms)}
                  </time>
                ) : (
                  <span className="muted">{t("compare.noBest")}</span>
                )}
              </p>
              <p className="muted">{t("history.bestTime")}</p>
            </div>
          </div>

          <div className="compare-recent">
            <RecentLaps title={t("compare.recentA")} laps={recentA} />
            <RecentLaps title={t("compare.recentB")} laps={recentB} />
          </div>
        </>
      )}
    </section>
  );
}

function RecentLaps({ title, laps }: { title: string; laps: Lap[] }) {
  return (
    <div className="compare-recent-col">
      <h3>{title}</h3>
      {laps.length === 0 ? (
        <p className="muted">{t("compare.noRecent")}</p>
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>{t("history.col.date")}</th>
                <th>{t("register.pi")}</th>
                <th>{t("register.class")}</th>
                <th>{t("history.col.time")}</th>
              </tr>
            </thead>
            <tbody>
              {laps.map((lap) => (
                <tr key={lap.id}>
                  <td>{formatRecordedDate(lap.recorded_at)}</td>
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
    </div>
  );
}
