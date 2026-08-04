import { useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { UpdateBanner } from "../components/UpdateBanner";
import { t, type Locale } from "../i18n";
import {
  applyParsedBackup,
  exportBackup,
  getSetting,
  openBackupForImport,
  setSetting,
} from "../lib/api";
import type { BackupFileV1 } from "../lib/backup/schema";
import { checkForAppUpdate, type UpdateInfo } from "../lib/updateCheck";

type SettingsPageProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => Promise<void>;
  onUpdateDismissed?: (kind: "session" | "version") => void;
};

type ManualUpdateStatus =
  | "idle"
  | "checking"
  | "upToDate"
  | "available"
  | "failed";

type ApplyMode = "replace" | "merge";

function tf(key: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.split(`{${k}}`).join(v),
    t(key),
  );
}

/** Map import `{ error }` to i18n: parse/schema → invalid; else apply. */
function backupImportErrorKey(error: string): string {
  if (
    error === "invalid_json" ||
    error === "invalid_schema" ||
    error.startsWith(": ") ||
    /^[a-zA-Z_][\w.[\]]*:\s/.test(error)
  ) {
    return "backup.errorInvalid";
  }
  return "backup.errorApply";
}

export function SettingsPage({
  locale,
  onLocaleChange,
  onUpdateDismissed,
}: SettingsPageProps) {
  const [status, setStatus] = useState<ManualUpdateStatus>("idle");
  const [manualInfo, setManualInfo] = useState<UpdateInfo | null>(null);
  const [localVersion, setLocalVersion] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupFileV1 | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  async function handleCheckForUpdates() {
    setStatus("checking");
    try {
      const version = await getVersion();
      setLocalVersion(version);
      const dismissed = await getSetting("update_dismissed_version");
      const result = await checkForAppUpdate({
        localVersion: version,
        dismissedVersion: dismissed,
      });
      if (result.status === "available") {
        setManualInfo(result.info);
        setStatus("available");
      } else if (result.status === "upToDate") {
        setManualInfo(null);
        setStatus("upToDate");
      } else {
        setManualInfo(null);
        setStatus("failed");
      }
    } catch {
      setManualInfo(null);
      setStatus("failed");
    }
  }

  async function handleExportBackup() {
    setBackupStatus(null);
    try {
      const result = await exportBackup();
      setBackupStatus(
        result === "saved" ? t("backup.exported") : t("backup.cancelled"),
      );
    } catch {
      setBackupStatus(t("backup.errorApply"));
    }
  }

  async function handleOpenImport() {
    setBackupStatus(null);
    setPendingBackup(null);
    try {
      const result = await openBackupForImport();
      if (result === "cancelled") {
        setBackupStatus(t("backup.cancelled"));
        return;
      }
      if ("error" in result) {
        setBackupStatus(t(backupImportErrorKey(result.error)));
        return;
      }
      setPendingBackup(result.backup);
    } catch {
      setBackupStatus(t("backup.errorApply"));
    }
  }

  async function handleApplyImport(mode: ApplyMode) {
    if (!pendingBackup) return;

    if (mode === "replace" && !window.confirm(t("backup.replaceConfirm"))) {
      setBackupStatus(t("backup.cancelled"));
      setPendingBackup(null);
      return;
    }

    setBackupStatus(null);
    try {
      const result = await applyParsedBackup(pendingBackup, mode);
      if (result === "imported") {
        setBackupStatus(t("backup.imported"));
      } else {
        setBackupStatus(t(backupImportErrorKey(result.error)));
      }
    } catch {
      setBackupStatus(t("backup.errorApply"));
    } finally {
      setPendingBackup(null);
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
            onUpdateDismissed?.("session");
          }}
          onDismissVersion={() => {
            void setSetting(
              "update_dismissed_version",
              manualInfo.remoteVersion,
            );
            setManualInfo(null);
            setStatus("idle");
            onUpdateDismissed?.("version");
          }}
        />
      ) : null}

      <fieldset className="locale-picker">
        <legend>{t("backup.title")}</legend>
        <button type="button" onClick={() => void handleExportBackup()}>
          {t("backup.export")}
        </button>
        {pendingBackup ? (
          <>
            <button
              type="button"
              onClick={() => void handleApplyImport("replace")}
            >
              {t("backup.replace")}
            </button>
            <button
              type="button"
              onClick={() => void handleApplyImport("merge")}
            >
              {t("backup.merge")}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => void handleOpenImport()}>
            {t("backup.import")}
          </button>
        )}
      </fieldset>
      {backupStatus ? <p className="muted">{backupStatus}</p> : null}
    </section>
  );
}
