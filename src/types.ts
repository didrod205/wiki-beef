// Pure, browser-safe data model — powers the CLI, the build-data script, and the
// web playground (which re-crawls live with this same core).

export type BeefCategory =
  | "nationality" // borders, birthplaces, "claimed by"
  | "politics"
  | "sports"
  | "pop-culture" // TV / film / music / games
  | "bio" // personal life, relationships, "controversy"
  | "style" // grammar, MOS, date formats
  | "vandalism" // cleanup, not a real war
  | "general";

/** One reverted edit, as the MediaWiki recentchanges API returns it. */
export interface RawChange {
  title: string;
  ns: number;
  user?: string;
  timestamp: string; // ISO
  comment: string;
  tags: string[];
  revid?: number;
}

export interface Beef {
  title: string;
  lang: string;
  ns: number;
  /** how many edits on this page got reverted in the window. */
  reverts: number;
  /** distinct editors whose edits were reverted. */
  editors: number;
  category: BeefCategory;
  /** one line: what they're actually fighting about. */
  about: string;
  /** a few cleaned edit summaries — the receipts. */
  quotes: string[];
  firstAt: string;
  lastAt: string;
  /** reverts per hour over the contested span. */
  velocity: number;
  score: number;
  historyUrl: string;
}

export interface BeefReport {
  lang: string;
  windowHours: number;
  generatedAt: string;
  /** total reverted edits crawled. */
  total: number;
  /** distinct contested pages. */
  pages: number;
  beefs: Beef[];
}

export const CATEGORY_LABELS: Record<BeefCategory, string> = {
  nationality: "Borders & nationality",
  politics: "Politics",
  sports: "Sports",
  "pop-culture": "Pop culture",
  bio: "Who-said-what (bios)",
  style: "Grammar & style",
  vandalism: "Vandalism cleanup",
  general: "General beef",
};

export const CATEGORY_EMOJI: Record<BeefCategory, string> = {
  nationality: "🗺️",
  politics: "🏛️",
  sports: "⚽",
  "pop-culture": "🎬",
  bio: "👤",
  style: "✍️",
  vandalism: "🧹",
  general: "🔥",
};
