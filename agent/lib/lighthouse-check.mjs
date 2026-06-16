import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

// Minimum Lighthouse score per category, as a 0-100 integer (matching what
// Lighthouse displays). Default floor is 93 across the board. Override any
// category with a repo variable, e.g. LH_MIN_PERFORMANCE=90.
function thresholds() {
  return {
    performance: int(process.env.LH_MIN_PERFORMANCE, 93),
    accessibility: int(process.env.LH_MIN_ACCESSIBILITY, 93),
    "best-practices": int(process.env.LH_MIN_BEST_PRACTICES, 93),
    seo: int(process.env.LH_MIN_SEO, 93),
  };
}

export async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  try {
    const runner = await lighthouse(
      url,
      { port: chrome.port, output: "json", logLevel: "error" },
      null
    );
    const cats = runner.lhr.categories;
    const min = thresholds();
    const scores = {};
    const failures = [];
    for (const key of Object.keys(min)) {
      const raw = cats[key] ? cats[key].score : null;
      // Compare on the displayed integer so a 92.6 shown as "93" is not failed.
      const shown = raw == null ? null : Math.round(raw * 100);
      scores[key] = shown;
      if (shown == null || shown < min[key]) {
        failures.push(`${key}: ${shown == null ? "n/a" : shown} (min ${min[key]})`);
      }
    }
    return { pass: failures.length === 0, scores, failures };
  } finally {
    await chrome.kill();
  }
}

// Treat unset/empty env vars as "use the default" — an unset repo variable
// renders as "" in the workflow, and Number("") is 0, which would silently
// disable the check.
function int(v, d) {
  if (v === undefined || v === null || String(v).trim() === "") return d;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : d;
}
