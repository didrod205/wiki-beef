#!/usr/bin/env node
import { cac } from "cac";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { crawlReverts } from "./crawl.js";
import { processChanges } from "./process.js";
import { toJSON } from "./render/json.js";
import { toMarkdown } from "./render/markdown.js";

const VERSION = "0.1.0";

interface Flags {
  lang?: string;
  hours?: number;
  top?: number;
  ns?: string;
  minReverts?: number;
  json?: boolean | string;
  md?: boolean | string;
  color?: boolean;
}

function fail(message: string): never {
  process.stderr.write(`\nwiki-beef: ${message}\n\n`);
  process.exit(2);
}

async function run(flags: Flags): Promise<void> {
  const lang = (flags.lang ?? "en").toLowerCase();
  const hours = flags.hours ?? 24;
  const top = flags.top ?? 15;
  const ns: number | "all" = flags.ns === "all" ? "all" : Number(flags.ns ?? 0);
  if (flags.color === false) process.env["NO_COLOR"] = "1";

  let report;
  try {
    const changes = await crawlReverts({ lang, hours, ns });
    report = processChanges(changes, { lang, windowHours: hours, minReverts: flags.minReverts ?? 2, limit: Math.max(top, 50) });
  } catch (e) {
    fail(`couldn't reach the MediaWiki API — ${(e as Error).message}`);
  }

  if (flags.json !== undefined) {
    const out = toJSON(report);
    if (typeof flags.json === "string") writeFileSync(resolve(flags.json), out + "\n", "utf8");
    else process.stdout.write(out + "\n");
  } else if (flags.md !== undefined) {
    const out = toMarkdown(report, top);
    if (typeof flags.md === "string") writeFileSync(resolve(flags.md), out, "utf8");
    else process.stdout.write(out);
  } else {
    const { renderConsole } = await import("./render/console.js");
    process.stdout.write(renderConsole(report, top));
  }
}

const cli = cac("wiki-beef");

cli
  .command("[...ignored]", "Show the live edit wars on Wikipedia (most-reverted articles right now)")
  .option("--lang <code>", "Wikipedia language edition (en, de, fr, es, ja, …)", { default: "en" })
  .option("--hours <n>", "How far back to look", { default: 24 })
  .option("--top <n>", "How many fights to show", { default: 15 })
  .option("--ns <ns>", "Namespace: 0 = articles (default), or 'all'", { default: "0" })
  .option("--min-reverts <n>", "Min reverts to count as a beef", { default: 2 })
  .option("--json [file]", "JSON output (the full BeefReport)")
  .option("--md [file]", "Markdown table")
  .option("--no-color", "Disable colors")
  .action((_ignored: string[], flags: Flags) => run(flags));

cli.help();
cli.version(VERSION);

try {
  cli.parse();
} catch (err) {
  fail((err as Error).message);
}
