import pc from "picocolors";
import type { BeefReport } from "../types.js";
import { CATEGORY_EMOJI, CATEGORY_LABELS } from "../types.js";

function ago(iso: string, now: number): string {
  const d = Math.max(0, now - Date.parse(iso));
  const m = Math.round(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function bar(score: number, max: number): string {
  const n = max > 0 ? Math.round((score / max) * 16) : 0;
  return pc.red("█".repeat(n)) + pc.dim("░".repeat(16 - n));
}

/** A terminal leaderboard of the current edit wars. */
export function renderConsole(r: BeefReport, top = 15, now = Date.now()): string {
  const L: string[] = [];
  const ind = "  ";
  L.push("");
  L.push(`${ind}${pc.bold("🥩 wiki-beef")} ${pc.dim(`— edit wars on ${r.lang}.wikipedia · last ${r.windowHours}h`)}`);
  L.push("");

  const shown = r.beefs.slice(0, top);
  if (shown.length === 0) {
    L.push(`${ind}${pc.green("Peace on Wikipedia right now — no edit wars in the window. 🕊️")}`);
    L.push("");
    return L.join("\n");
  }
  const max = shown[0]!.score;
  shown.forEach((b, i) => {
    const rank = pc.dim(`${String(i + 1).padStart(2, " ")}.`);
    L.push(`${ind}${rank} ${CATEGORY_EMOJI[b.category]} ${pc.bold(b.title)} ${pc.dim("· " + CATEGORY_LABELS[b.category])}`);
    L.push(`${ind}    ${bar(b.score, max)} ${pc.red(String(b.score))} ${pc.dim(`· ${b.reverts} reverts · ${b.editors} editors · ${b.velocity}/h · last ${ago(b.lastAt, now)}`)}`);
    if (b.about && b.about !== "(no edit summary)") L.push(`${ind}    ${pc.yellow("“" + b.about.slice(0, 110) + "”")}`);
  });
  L.push("");
  L.push(`${ind}${pc.dim(`${r.total} reverted edits · ${r.pages} contested pages · live from the MediaWiki API, no key.`)}`);
  L.push(`${ind}${pc.dim("open a fight:")} ${pc.cyan(shown[0]!.historyUrl)}`);
  L.push("");
  return L.join("\n");
}
