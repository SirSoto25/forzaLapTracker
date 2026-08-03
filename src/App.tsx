import { useEffect, useState } from "react";
import "./App.css";
import { initDb } from "./db/client";
import {
  loadLocale,
  setLocale,
  t,
  type Locale,
} from "./i18n";
import { SettingsPage } from "./pages/SettingsPage";

type Route = "circuits" | "register" | "history" | "compare" | "settings";

const routes: Route[] = [
  "circuits",
  "register",
  "history",
  "compare",
  "settings",
];

function PlaceholderPage({ route }: { route: Exclude<Route, "settings"> }) {
  return (
    <section className="page">
      <p className="eyebrow">{t(`nav.${route}`)}</p>
      <h2>{t(`page.${route}.title`)}</h2>
      <p className="placeholder">{t(`page.${route}.placeholder`)}</p>
    </section>
  );
}

function App() {
  const [route, setRoute] = useState<Route>("circuits");
  const [locale, setCurrentLocale] = useState<Locale>("es");

  useEffect(() => {
    void initDb().then(loadLocale).then(setCurrentLocale);
  }, []);

  async function changeLocale(nextLocale: Locale) {
    await setLocale(nextLocale);
    setCurrentLocale(nextLocale);
  }

  return (
    <div className="app-shell">
      <aside>
        <header>
          <span className="brand-mark">FL</span>
          <h1>{t("app.name")}</h1>
        </header>
        <nav aria-label={t("app.name")}>
          {routes.map((item) => (
            <button
              className={route === item ? "active" : ""}
              key={item}
              type="button"
              aria-current={route === item ? "page" : undefined}
              onClick={() => setRoute(item)}
            >
              {t(`nav.${item}`)}
            </button>
          ))}
        </nav>
      </aside>
      <main>
        {route === "settings" ? (
          <SettingsPage locale={locale} onLocaleChange={changeLocale} />
        ) : (
          <PlaceholderPage route={route} />
        )}
      </main>
    </div>
  );
}

export default App;
