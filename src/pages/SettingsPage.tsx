import { useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { UpdateBanner } from "../components/UpdateBanner";
import { t, type Locale } from "../i18n";
import { getSetting, setSetting } from "../lib/api";
import { checkForAppUpdate, type UpdateInfo } from "../lib/updateCheck";

type SettingsPageProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => Promise<void>;
};

type ManualUpdateStatus =
  | "idle"
  | "checking"
  | "upToDate"
  | "available"
  | "failed";

function tf(key: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.split(`{${k}}`).join(v),
    t(key),
  );
}

export function SettingsPage({
  locale,
  onLocaleChange,
}: SettingsPageProps) {
  const [status, setStatus] = useState<ManualUpdateStatus>("idle");
  const [manualInfo, setManualInfo] = useState<UpdateInfo | null>(null);
  const [localVersion, setLocalVersion] = useState<string | null>(null);

  async function handleCheckForUpdates() {
    setStatus("checking");
    try {
      const version = await getVersion();
      setLocalVersion(version);
      const dismissed = await getSetting("update_dismissed_version");
      const info = await checkForAppUpdate({
        localVersion: version,
        dismissedVersion: dismissed,
      });
      if (info) {
        setManualInfo(info);
        setStatus("available");
      } else {
        setManualInfo(null);
        setStatus("upToDate");
      }
    } catch {
      setStatus("failed");
    }
  }

  return (
    <section className="page">
      <p className="eyebrow">{t("nav.settings")}</p>
      <h2>{t("settings.title")}</h2>
      <fieldset className="locale-picker">
        <legend>{t("settings.language")}</legend>
        {(["es", "en"] as const).map((option) => (
          <button
            className={locale === option ? "active" : ""}
            key={option}
            type="button"
            aria-pressed={locale === option}
            onClick={() => void onLocaleChange(option)}
          >
            {t(`settings.${option === "es" ? "spanish" : "english"}`)}
          </button>
        ))}
      </fieldset>

      <fieldset className="locale-picker">
        <legend>{t("update.check")}</legend>
        <button
          type="button"
          disabled={status === "checking"}
          onClick={() => void handleCheckForUpdates()}
        >
          {t("update.check")}
        </button>
      </fieldset>
      {status === "checking" ? (
        <p className="muted">{t("update.checking")}</p>
      ) : null}
      {status === "upToDate" && localVersion ? (
        <p className="muted">
          {tf("update.upToDate", { version: localVersion })}
        </p>
      ) : null}
      {status === "failed" ? (
        <p className="muted">{t("update.checkFailed")}</p>
      ) : null}
      {status === "available" && manualInfo ? (
        <UpdateBanner
          info={manualInfo}
          onDismissSession={() => {
            setManualInfo(null);
            setStatus("idle");
          }}
          onDismissVersion={() => {
            void setSetting(
              "update_dismissed_version",
              manualInfo.remoteVersion,
            );
            setManualInfo(null);
            setStatus("idle");
          }}
        />
      ) : null}
    </section>
  );
}
