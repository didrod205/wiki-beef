import { crawlReverts, processChanges, CATEGORY_LABELS, CATEGORY_EMOJI } from "../src/index.js";
import type { BeefReport } from "../src/index.js";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const board = $<HTMLElement>("board");
const metaEl = $<HTMLElement>("meta");
const statusEl = $<HTMLElement>("status");
const langSel = $<HTMLSelectElement>("lang");
const refreshBtn = $<HTMLButtonElement>("refresh");

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function ago(iso: string): string {
  const d = Math.max(0, Date.now() - Date.parse(iso));
  const m = Math.round(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function render(r: BeefReport, live: boolean): void {
  metaEl.textContent = `${r.beefs.length} live fights · ${r.total.toLocaleString()} reverted edits across ${r.pages.toLocaleString()} pages · ${live ? "just crawled" : "updated"} ${ago(r.generatedAt)}`;

  if (r.beefs.length === 0) {
    board.innerHTML = `<div class="empty">Peace on ${escapeHtml(r.lang)}.wikipedia right now — no edit wars in the window. 🕊️</div>`;
    return;
  }
  const max = r.beefs[0]!.score || 1;
  board.innerHTML = r.beefs
    .map((b, i) => {
      const pct = Math.round((b.score / max) * 100);
      const receipts =
        b.quotes.length > 1
          ? `<details class="receipts"><summary>the receipts (${b.quotes.length})</summary><ul>${b.quotes.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ul></details>`
          : "";
      const about = b.about && b.about !== "(no edit summary)" ? `<div class="about">${escapeHtml(b.about)}</div>` : "";
      return `<div class="beef">
        <div class="row1">
          <span class="rank">${i + 1}</span>
          <a class="title" href="${escapeHtml(b.historyUrl)}" target="_blank" rel="noopener">${escapeHtml(b.title)}</a>
          <span class="cat">${CATEGORY_EMOJI[b.category]} ${escapeHtml(CATEGORY_LABELS[b.category])}</span>
        </div>
        <div class="gauge"><span style="width:${pct}%"></span></div>
        <div class="stats"><b>${b.score}</b> · <b>${b.reverts}</b> reverts · <b>${b.editors}</b> editors · ${b.velocity}/h · last ${ago(b.lastAt)}</div>
        ${about}
        ${receipts}
      </div>`;
    })
    .join("");
}

async function loadStatic(): Promise<void> {
  try {
    const res = await fetch("./data/beefs.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(String(res.status));
    render((await res.json()) as BeefReport, false);
  } catch {
    metaEl.textContent = "No cached data yet — hit 🔄 to crawl Wikipedia live.";
  }
}

async function refreshLive(): Promise<void> {
  const lang = langSel.value;
  refreshBtn.disabled = true;
  statusEl.textContent = `crawling ${lang}.wikipedia…`;
  try {
    const changes = await crawlReverts({ lang, hours: 24, ns: 0, max: 1500 });
    const report = processChanges(changes, { lang, windowHours: 24, minReverts: 2, limit: 40 });
    render(report, true);
    statusEl.textContent = "live ✓";
  } catch (e) {
    statusEl.textContent = `couldn't reach ${lang}.wikipedia (${(e as Error).message})`;
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener("click", refreshLive);
// Switching to a non-English edition has no cached file — crawl it live.
langSel.addEventListener("change", () => {
  if (langSel.value !== "en") refreshLive();
  else loadStatic();
});

void loadStatic();
