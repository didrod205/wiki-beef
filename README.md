# wiki-beef 🥩

**The pettiest edit wars on Wikipedia, right now.** Crawls the live MediaWiki API for the articles being reverted to death, scores the beef, and decodes what people are actually fighting about — borders, birthplaces, “is a hot dog a sandwich.” No API key, 100% public data, nothing uploaded.

### 🌐 [**Live leaderboard →**](https://didrod205.github.io/wiki-beef/) · auto-updated every few hours

The site crawls Wikipedia straight from your browser (hit **🔄 refresh live** to re-crawl any language edition). Same engine in your terminal:

```bash
npx wiki-beef
```

```
  🥩 wiki-beef — edit wars on en.wikipedia · last 24h

   1. 🗺️ Nikola Tesla · Borders & nationality
      ████████████████ 290 · 21 reverts · 10 editors · 4.2/h · last 12m ago
      “rv, he was Serbian-American per consensus, see talk”
   2. ⚽ List of FIFA World Cup top goalscorers · Sports
      ██████████░░░░░░ 151 · 10 reverts · 8 editors · 2.3/h · last 1h ago
      “Updated Messi's goals in FIFA world cup”
   3. 🔥 Shrek the Third · General beef
      ████████░░░░░░░░ 146 · 9 reverts · 3 editors · 36/h · last 6h ago
      “you just revert it without explaining why”

  2,000 reverted edits · 1,198 contested pages · live from the MediaWiki API, no key.
```

## Why

Wikipedia is a quiet, never-ending war. Most of it happens in the **revert** — one
editor undoes another, then it’s undone back, over a birthplace, a date, a flag, a
pronoun, a comma. `wiki-beef` finds the articles where that’s happening *right now*,
ranks them by how hot the fight is, sorts the genuine disputes from plain vandalism
cleanup, and surfaces the actual edit summaries — the receipts.

It’s a **window into public data, not a verdict.** A high score means a lot of
reverts by a lot of editors, fast — not that anyone is wrong. The drama is already
public; this just ranks it.

## How it works

```
MediaWiki recentchanges API  ─crawl→  reverted edits  ─group→  contested pages
   (mw-reverted tag, no key)              ─score→  reverts × editors × velocity
                                          ─classify→  nationality / politics / bio / …
                                          ─→  ranked leaderboard
```

- **Crawl** (`crawlReverts`) — pulls the edits tagged `mw-reverted` over a time
  window from any language edition. Browser-safe (no `node:*`), so it runs in the
  CLI, in CI, and live in the web page (MediaWiki allows anonymous CORS).
- **Score** (`scoreBeef`) — `reverts × editors × velocity`, **boosted** by
  real-dispute signals (`per talk`, `POV`, `consensus`, `unsourced`) and
  **penalized** for vandalism signals (`rvv`, `blanking`) — so genuine fights
  outrank routine cleanup.
- **Classify** (`classify`) — a curated lexicon sorts each fight into borders &
  nationality 🗺️, politics 🏛️, sports ⚽, pop culture 🎬, bios 👤, grammar ✍️,
  vandalism 🧹, or general beef 🔥.
- The **live site** is static: a GitHub Action re-crawls every few hours, commits a
  fresh `beefs.json`, and the page renders it — no server, no database.

## Install & usage

```bash
npm i -g wiki-beef      # then:  wiki-beef
# or zero-install:
npx wiki-beef
```

```bash
wiki-beef                          # today's top fights on en.wikipedia
wiki-beef --lang de                # any edition: de, fr, es, ru, ja, zh, pt…
wiki-beef --hours 6 --top 25       # tighter window, more results
wiki-beef --ns all                 # include talk/user pages, not just articles
wiki-beef --md > beefs.md          # a Markdown table
wiki-beef --json | jq '.beefs[0]'  # the full report as JSON
```

`beef` is a shorter alias for the same command.

| Flag | |
| --- | --- |
| `--lang <code>` | Wikipedia language edition (default `en`) |
| `--hours <n>` | how far back to look (default 24) |
| `--top <n>` | how many fights to show (default 15) |
| `--ns <0\|all>` | namespace — articles only (default) or everything |
| `--min-reverts <n>` | min reverts to count as a beef (default 2) |
| `--json [file]` / `--md [file]` | machine-readable / Markdown output |

## Library

The core is pure and browser-safe — crawl + process anywhere:

```ts
import { getBeefs, crawlReverts, processChanges } from "wiki-beef";

const report = await getBeefs({ lang: "en", hours: 24, top: 20 });
report.beefs[0]; // { title, score, reverts, editors, category, about, quotes, historyUrl, … }

// or split it:
const changes = await crawlReverts({ lang: "fr", hours: 12 });
const beefs = processChanges(changes, { lang: "fr" });
```

## Privacy & etiquette

All data comes from Wikipedia’s **public** [MediaWiki API](https://www.mediawiki.org/wiki/API:Main_page) — recent changes that are visible to anyone. No account, no key, nothing about *you* is sent anywhere. The crawler identifies itself with a descriptive `User-Agent` and a polite request cadence. Be a good citizen: don’t crank `--hours` absurdly high in a tight loop.

It points at *articles*, never at individual editors — usernames are only counted, never ranked or shamed.

## Contributing

The most useful contribution is **a better classifier** — a keyword that catches a
kind of fight the lexicon misses, or a score tweak that better separates real
disputes from cleanup. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © [didrod205](https://github.com/didrod205)

---

<sub>It’s public Wikipedia drama — no judgment, just the receipts.</sub>

## 💖 Sponsor

Find this useful? [**Sponsor on GitHub**](https://github.com/sponsors/didrod205) — it keeps these projects maintained.

[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub-db61a2?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/didrod205)
