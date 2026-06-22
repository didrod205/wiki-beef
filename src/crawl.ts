import type { RawChange } from "./types.js";

// Browser-safe: uses only the global `fetch` + `URL`, no node:* imports — so the
// exact same crawler runs in the CLI, the cron build script, AND live in the
// web page (MediaWiki allows anonymous CORS with origin=*).

const UA = "wiki-beef/0.1 (+https://github.com/didrod205/wiki-beef)";

export interface CrawlOptions {
  /** Wikipedia language edition, e.g. "en", "de", "fr", "es", "ja". */
  lang?: string;
  /** How far back to look, in hours. */
  hours?: number;
  /** Cap on total reverted edits fetched. */
  max?: number;
  /** Namespace: 0 = articles (default), or "all". */
  ns?: number | "all";
  /** Inject a fetch (tests). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  /** Clock injection (tests). */
  now?: number;
}

interface RcItem {
  title?: string;
  ns?: number;
  user?: string;
  timestamp?: string;
  comment?: string;
  tags?: string[];
  revid?: number;
}

/**
 * Pull the edits that got **reverted** in the window (the `mw-reverted` tag),
 * newest first, following the API's continuation until the window is covered.
 * Reverted edits are the fingerprint of a contested page — the more a page shows
 * up here, the harder people are fighting over it.
 */
export async function crawlReverts(opts: CrawlOptions = {}): Promise<RawChange[]> {
  const lang = opts.lang ?? "en";
  const hours = opts.hours ?? 24;
  const max = opts.max ?? 2000;
  const ns = opts.ns ?? 0;
  const f = opts.fetchImpl ?? fetch;
  const now = opts.now ?? Date.now();
  const endIso = new Date(now - hours * 3_600_000).toISOString();

  const base = `https://${lang}.wikipedia.org/w/api.php`;
  const params = new URLSearchParams({
    action: "query",
    list: "recentchanges",
    format: "json",
    formatversion: "2",
    rcprop: "title|timestamp|comment|tags|user|ids",
    rctype: "edit",
    rctag: "mw-reverted",
    rclimit: "500",
    rcdir: "older",
    rcend: endIso,
    origin: "*",
  });
  if (ns !== "all") params.set("rcnamespace", String(ns));

  const out: RawChange[] = [];
  let cont: string | undefined;
  for (let page = 0; page < 20 && out.length < max; page++) {
    if (cont) params.set("rccontinue", cont);
    else params.delete("rccontinue");
    const res = await f(`${base}?${params.toString()}`, {
      headers: { "Api-User-Agent": UA, "User-Agent": UA },
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`MediaWiki ${lang} responded ${res.status}`);
    const data = (await res.json()) as { query?: { recentchanges?: RcItem[] }; continue?: { rccontinue?: string } };
    for (const it of data.query?.recentchanges ?? []) {
      out.push({
        title: it.title ?? "",
        ns: it.ns ?? 0,
        user: it.user,
        timestamp: it.timestamp ?? "",
        comment: it.comment ?? "",
        tags: it.tags ?? [],
        revid: it.revid,
      });
    }
    cont = data.continue?.rccontinue;
    if (!cont) break;
  }
  return out.slice(0, max);
}
