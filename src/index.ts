// Public, browser-safe API. No node:* imports here — the web playground imports
// this file directly to re-crawl Wikipedia live.
export { crawlReverts } from "./crawl.js";
export type { CrawlOptions } from "./crawl.js";
export { processChanges } from "./process.js";
export type { ProcessOptions } from "./process.js";
export { scoreBeef } from "./score.js";
export type { ScoreInput } from "./score.js";
export { classify, cleanComment, warSignals, vandalSignals } from "./classify.js";
export { CATEGORY_LABELS, CATEGORY_EMOJI } from "./types.js";
export type { Beef, BeefReport, BeefCategory, RawChange } from "./types.js";

import { crawlReverts, type CrawlOptions } from "./crawl.js";
import { processChanges, type ProcessOptions } from "./process.js";
import type { BeefReport } from "./types.js";

/** Crawl + process in one call — the whole thing, live. */
export async function getBeefs(opts: CrawlOptions & ProcessOptions = {}): Promise<BeefReport> {
  const changes = await crawlReverts(opts);
  return processChanges(changes, { ...opts, lang: opts.lang ?? "en" });
}
