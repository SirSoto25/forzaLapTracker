import { useEffect, useState, type FormEvent } from "react";
import { CarPicker } from "../components/CarPicker";
import { TimeInput } from "../components/TimeInput";
import type { Circuit } from "../db/types";
import { parseLapTime } from "../domain/lapTime";
import { piToClass, type CarClass } from "../domain/piClass";
import { t } from "../i18n";
import { insertLap, listCircuits } from "../lib/api";

type RegisterLapPageProps = {
  selectedCircuitId: number | null;
};

export function RegisterLapPage({
  selectedCircuitId,
}: RegisterLapPageProps) {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [circuitId, setCircuitId] = useState<number | null>(selectedCircuitId);
  const [carId, setCarId] = useState<number | null>(null);
  const [piText, setPiText] = useState("");
  const [liveClass, setLiveClass] = useState<CarClass | null>(null);
  const [piError, setPiError] = useState<string | null>(null);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (piText.trim() === "") {
      setLiveClass(null);
      setPiError(null);
      return;
    }
    const pi = Number(piText);
    try {
      setLiveClass(piToClass(pi));
      setPiError(null);
    } catch (err: unknown) {
      setLiveClass(null);
      setPiError(err instanceof Error ? err.message : t("register.piInvalid"));
    }
  }, [piText]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (circuitId === null) {
      setError(t("register.selectCircuit"));
      return;
    }
    if (carId === null) {
      setError(t("register.selectCar"));
      return;
    }

    let pi: number;
    try {
      pi = Number(piText);
      piToClass(pi);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("register.piInvalid"));
      return;
    }

    let timeMs: number;
    try {
      timeMs = parseLapTime(time);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("register.timeInvalid"));
      return;
    }

    setSaving(true);
    try {
      await insertLap({
        circuitId,
        carId,
        pi,
        timeMs,
        notes: notes.trim() || null,
      });
      setSaved(true);
      setTime("");
      setNotes("");
      setPiText("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <p className="eyebrow">{t("nav.register")}</p>
      <h2>{t("page.register.title")}</h2>

      <form className="register-form" onSubmit={(e) => void onSubmit(e)}>
        <label>
          <span>{t("register.circuit")}</span>
          <select
            value={circuitId ?? ""}
            onChange={(e) =>
              setCircuitId(e.target.value ? Number(e.target.value) : null)
            }
            required
          >
            <option value="">{t("register.selectCircuit")}</option>
            {circuits.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="field-label">{t("register.car")}</span>
          <CarPicker carId={carId} onChange={setCarId} />
        </div>

        <label>
          <span>{t("register.pi")}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            step={1}
            value={piText}
            onChange={(e) => setPiText(e.target.value)}
            aria-invalid={piError !== null}
            required
          />
          {liveClass ? (
            <span className="pi-class">
              {t("register.class")}: <strong>{liveClass}</strong>
            </span>
          ) : null}
          {piError ? (
            <span className="form-error" role="alert">
              {piError}
            </span>
          ) : null}
        </label>

        <label>
          <span>{t("register.time")}</span>
          <TimeInput
            value={time}
            onChange={setTime}
            placeholder={t("register.timePlaceholder")}
            aria-invalid={false}
          />
        </label>

        <label>
          <span>{t("register.notes")}</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </label>

        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {saved ? (
          <p className="form-success" role="status">
            {t("register.saved")}
          </p>
        ) : null}

        <button type="submit" disabled={saving || piError !== null}>
          {t("register.save")}
        </button>
      </form>
    </section>
  );
}
