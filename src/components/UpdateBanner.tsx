import { openUrl } from "@tauri-apps/plugin-opener";
import { t } from "../i18n";
import type { UpdateInfo } from "../lib/updateCheck";

type Props = {
  info: UpdateInfo;
  onDismissSession: () => void;
  onDismissVersion: () => void;
};

function tf(key: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.split(`{${k}}`).join(v),
    t(key),
  );
}

export function UpdateBanner({
  info,
  onDismissSession,
  onDismissVersion,
}: Props) {
  return (
    <div className="update-banner" role="status">
      <p>{tf("update.available", { version: info.remoteVersion })}</p>
      <div className="update-banner-actions">
        <button
          type="button"
          onClick={() => void openUrl(info.releaseUrl)}
        >
          {t("update.view")}
        </button>
        <button type="button" className="ghost" onClick={onDismissSession}>
          {t("update.dismiss")}
        </button>
        <button type="button" className="ghost" onClick={onDismissVersion}>
          {t("update.dismissVersion")}
        </button>
      </div>
    </div>
  );
}
