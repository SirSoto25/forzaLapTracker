import { t, type Locale } from "../i18n";

type SettingsPageProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => Promise<void>;
};

export function SettingsPage({
  locale,
  onLocaleChange,
}: SettingsPageProps) {
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
    </section>
  );
}
