import type { BeefCategory } from "./types.js";

/**
 * Turn a raw MediaWiki edit summary into something readable. Summaries look like
 * `/* Personal life *​/ rv unsourced per [[WP:BLP]]` — we pull out the section
 * name and strip the wiki markup.
 */
export function cleanComment(comment: string): { section?: string; text: string } {
  let s = comment || "";
  const m = s.match(/\/\*\s*(.*?)\s*\*\//);
  const section = m && m[1] ? m[1].trim() : undefined;
  s = s.replace(/\/\*.*?\*\//g, " ");
  s = s.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1"); // [[A|B]] -> B, [[A]] -> A
  s = s.replace(/\[(?:https?:\/\/\S+)\s+([^\]]+)\]/g, "$1"); // [url label] -> label
  s = s.replace(/'''?/g, "").replace(/<[^>]+>/g, " ");
  s = s.replace(/\bTag:\s.*$/i, "");
  s = s.replace(/\s+/g, " ").trim();
  return section ? { section, text: s } : { text: s };
}

// Category lexicon — checked in order, spicier/more-specific first.
const CATEGORIES: { cat: BeefCategory; kw: string[] }[] = [
  { cat: "nationality", kw: ["nationality", "born in", "birthplace", "place of birth", "citizen", "ethnic", "territor", "occupied", "annex", "disputed", "flag of", "sovereign", "republic of", "province of", "claimed by", "indigenous", "native name", "endonym"] },
  { cat: "politics", kw: ["election", "president", "prime minister", "political party", "senator", "parliament", "government", "left-wing", "right-wing", "regime", "communist", "fascist", "genocide", "war crime", "coup", "dictator", "protest"] },
  { cat: "sports", kw: ["transfer", " goals", "appearances", " club", " fc ", "fifa", "uefa", " nba", " nfl", " match", "fixture", " league", "tournament", " medal", "world cup", "season stats", "career statistics"] },
  { cat: "pop-culture", kw: ["episode", " album", " single", "box office", " cast", "release date", "video game", "soundtrack", "discography", "tracklist", "billboard", "anime", "manga", " film ", " series", "voice actor"] },
  { cat: "bio", kw: ["personal life", "relationship", "girlfriend", "boyfriend", "spouse", " wife", "husband", "net worth", "date of birth", "cause of death", "early life", "controversy", "allegation", "sexuality", "gender"] },
  { cat: "style", kw: ["grammar", "spelling", "typo", "punctuation", "capitaliz", "date format", "mos:", "engvar", "wikilink", "formatting", "alphabetiz", "citation needed", "ref fix"] },
];

const VANDAL_KW = ["vandal", "rvv", "test edit", "not constructive", "disruptive", "unexplained removal", "unexplained content removal", "nonsense", "spam", "promotional", "blanking", "hoax", "libel"];

const WAR_KW = ["per talk", "per consensus", "per the talk", "rv pov", "pov push", "not neutral", "npov", "undue", "edit warring", "self-revert", "consensus", "disputed", "original research", "unsourced", "reliable source", "no consensus", "restore", "revert to", "stable version", "as discussed"];

function countHits(hay: string, kws: string[]): number {
  let n = 0;
  for (const k of kws) if (hay.includes(k)) n++;
  return n;
}

/** Decide the kind of fight from the title + cleaned summaries. */
export function classify(title: string, texts: string[]): BeefCategory {
  const hay = ` ${title} ${texts.join(" ")} `.toLowerCase();
  for (const { cat, kw } of CATEGORIES) if (kw.some((k) => hay.includes(k))) return cat;
  if (VANDAL_KW.some((k) => hay.includes(k))) return "vandalism";
  return "general";
}

/** How many "this is a real content dispute" signals appear. */
export function warSignals(texts: string[]): number {
  return countHits(texts.join(" ").toLowerCase(), WAR_KW);
}

/** How many "this is just vandalism cleanup" signals appear. */
export function vandalSignals(texts: string[]): number {
  return countHits(texts.join(" ").toLowerCase(), VANDAL_KW);
}
