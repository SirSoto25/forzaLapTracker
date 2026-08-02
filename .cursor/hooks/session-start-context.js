/**
 * Inject Graphify + latest context dump paths at session start.
 */
const fs = require("fs");
const path = require("path");

function main() {
  const root = process.cwd();
  const graphJson = path.join(root, "graphify-out", "graph.json");
  const graphReport = path.join(root, "graphify-out", "GRAPH_REPORT.md");
  const ledger = path.join(root, "docs", "context", "LEDGER.md");
  const current = path.join(root, "docs", "context", "CURRENT.md");
  const dumpsDir = path.join(root, "docs", "context", "dumps");

  let latestDump = "(none yet)";
  try {
    if (fs.existsSync(dumpsDir)) {
      const files = fs
        .readdirSync(dumpsDir)
        .filter((f) => f.endsWith("-dump.md"))
        .map((f) => ({
          f,
          t: fs.statSync(path.join(dumpsDir, f)).mtimeMs,
        }))
        .sort((a, b) => b.t - a.t);
      if (files.length) latestDump = `docs/context/dumps/${files[0].f}`;
    }
  } catch {
    /* ignore */
  }

  const additional_context = [
    "Forza Lap Tracker continuity:",
    `- Knowledge graph (Graphify): ${exists(graphJson) ? "graphify-out/graph.json — prefer graphify query/path/explain" : "MISSING — run: graphify update ."}`,
    `- Graph report: ${exists(graphReport) ? "graphify-out/GRAPH_REPORT.md" : "(run clustered /graphify . for report)"}`,
    `- Latest context dump: ${latestDump}`,
    `- Scratch: ${exists(current) ? "docs/context/CURRENT.md" : "(missing)"}`,
    `- Ledger: ${exists(ledger) ? "docs/context/LEDGER.md" : "(missing)"}`,
    "- After code changes: graphify update . | At ~90% context: skill context-continuity then fresh chat.",
  ].join("\n");

  process.stdout.write(JSON.stringify({ additional_context }));
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

main();
