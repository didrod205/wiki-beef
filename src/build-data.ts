// Node entry run by the GitHub Actions cron (and locally to seed). Crawls the
// live MediaWiki API, processes it, and writes the report the static site reads.
// Output lives in web/public/data so Vite copies it into the Pages build.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { crawlReverts } from "./crawl.js";
import { processChanges } from "./process.js";

async function main(): Promise<void> {
  const lang = (process.env["WIKI_BEEF_LANG"] ?? "en").toLowerCase();
  const hours = Number(process.env["WIKI_BEEF_HOURS"] ?? 24);
  const out = resolve(process.cwd(), "web/public/data/beefs.json");

  process.stdout.write(`wiki-beef: crawling ${lang}.wikipedia (last ${hours}h)…\n`);
  const changes = await crawlReverts({ lang, hours, ns: 0, max: 3000 });
  const report = processChanges(changes, { lang, windowHours: hours, minReverts: 2, limit: 40 });

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report) + "\n", "utf8");
  process.stdout.write(`wiki-beef: ${report.total} reverted edits → ${report.beefs.length} beefs across ${report.pages} pages → ${out}\n`);
}

main().catch((e) => {
  process.stderr.write(`wiki-beef build-data failed: ${(e as Error).message}\n`);
  process.exit(1);
});
