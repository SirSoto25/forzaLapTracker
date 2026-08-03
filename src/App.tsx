import { useEffect, useState } from "react";
import "./App.css";
import { initDb } from "./db/client";
import {
  applyLocale,
  loadLocale,
  persistLocale,
  t,
  type Locale,
} from "./i18n";
import { CatalogPage } from "./pages/CatalogPage";
import { CircuitsPage } from "./pages/CircuitsPage";
import { ComparePage } from "./pages/ComparePage";
import { HistoryPage } from "./pages/HistoryPage";
import { RegisterLapPage } from "./pages/RegisterLapPage";
import { SettingsPage } from "./pages/SettingsPage";

type Route =
  | "circuits"
  | "catalog"
  | "register"
  | "history"
  | "compare"
  | "settings";

const routes: Route[] = [
  "circuits",
  "catalog",
  "register",
  "history",
  "compare",
  "settings",
];

type BootState = "loading" | "ready" | "error";

function App() {
  const [route, setRoute] = useState<Route>("circuits");
  const [selectedCircuitId, setSelectedCircuitId] = useState<number | null>(
    null,
  );
  const [locale, setLocale] = useState<Locale>("es");
  const [bootState, setBootState] = useState<BootState>("loading");
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    applyLocale(locale);
  }, [locale]);

  useEffect(() => {
    void initDb()
      .then(() => loadLocale())
      .then((loaded) => {
        setLocale(loaded);
        setBootState("ready");
      })
      .catch((error: unknown) => {
        applyLocale("es");
        setBootError(error instanceof Error ? error.message : String(error));
        setBootState("error");
      });
  }, []);

  async function changeLocale(nextLocale: Locale) {
    await persistLocale(nextLocale);
    setLocale(nextLocale);
  }

  if (bootState === "error") {
    return (
      <div className="boot-error" role="alert">
        <p className="eyebrow">{t("app.name")}</p>
        <h1>{t("app.boot.error.title")}</h1>
        <p>{t("app.boot.error.message")}</p>
        {bootError ? <pre className="boot-error-detail">{bootError}</pre> : null}
      </div>
    );
  }

  if (bootState === "loading") {
    return null;
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
        ) : route === "circuits" ? (
          <CircuitsPage
            onNavigate={(next, circuitId) => {
              setSelectedCircuitId(circuitId);
              setRoute(next);
            }}
          />
        ) : route === "catalog" ? (
          <CatalogPage />
        ) : route === "register" ? (
          <RegisterLapPage selectedCircuitId={selectedCircuitId} />
        ) : route === "history" ? (
          <HistoryPage selectedCircuitId={selectedCircuitId} />
        ) : route === "compare" ? (
          <ComparePage selectedCircuitId={selectedCircuitId} />
        ) : null}
      </main>
    </div>
  );
}

export default App;
