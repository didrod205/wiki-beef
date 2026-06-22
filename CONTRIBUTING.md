# Contributing to wiki-beef

Thanks for your interest! The most welcome contribution is a **sharper
classifier** — the lexicon that decides *what kind of fight* a page is, and the
score that separates real disputes from vandalism cleanup.

## Getting started

```bash
git clone https://github.com/didrod205/wiki-beef.git
cd wiki-beef
npm install
npm test            # vitest
npm run typecheck
npm run build       # tsup → dist/
npm run example     # live: today's edit wars in your terminal
npm run dev         # the site at localhost:5173 (hit 🔄 to crawl live)
```

## Project layout

```
src/
  crawl.ts      # MediaWiki recentchanges (mw-reverted) — browser-safe, no key
  classify.ts   # cleanComment + category lexicon + war/vandal signals (pure)
  score.ts      # reverts × editors × velocity, war boost / vandal penalty (pure)
  process.ts    # changes → ranked BeefReport (pure)
  render/       # console / markdown / json
  cli.ts        # cac CLI (crawls live)
  build-data.ts # node: crawl → web/public/data/beefs.json (run by the cron)
web/            # the static site (reuses src/ to re-crawl live in the browser)
.github/workflows/crawl.yml   # re-crawls every few hours and commits the data
tests/          # classify/score/process on fixtures + crawl parsing
```

## Improving the classifier

Edit `src/classify.ts`:

- **A new category signal** → add a keyword to the right `CATEGORIES` entry.
  Keywords are matched (lowercased) against the title + cleaned edit summaries.
- **A dispute vs. cleanup signal** → add to `WAR_KW` (boosts score) or `VANDAL_KW`
  (penalizes it). The goal is that a real content fight (“rv POV, see talk”) ranks
  above routine vandalism reverts (“rvv blanking”).

Add a test in `tests/core.test.ts` with a small fixture, and keep the calibration
test green (the genuine dispute must outrank the vandalism cleanup).

## The one rule

This points at **articles, never editors.** Don’t add anything that ranks, names,
or shames individual users — usernames are only ever *counted*. It’s a window into
public drama, not a tool for picking on people.

## Quality bar

- [ ] `npm run typecheck && npm test && npm run build` pass.
- [ ] The core imports no `node:*` — keep it browser-safe (the site re-crawls live).
