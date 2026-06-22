import { describe, it, expect } from "vitest";
import { cleanComment, classify, warSignals, vandalSignals } from "../src/classify.js";
import { scoreBeef } from "../src/score.js";
import { processChanges } from "../src/process.js";
import { crawlReverts } from "../src/crawl.js";
import type { RawChange } from "../src/types.js";

describe("cleanComment", () => {
  it("pulls the section name and strips wiki markup", () => {
    const r = cleanComment("/* Personal life */ rv [[WP:BLP|BLP]] vio '''unsourced'''");
    expect(r.section).toBe("Personal life");
    expect(r.text).toBe("rv BLP vio unsourced");
  });
  it("handles a bare summary", () => {
    expect(cleanComment("revert per talk").text).toBe("revert per talk");
  });
});

describe("classify", () => {
  it("spots a nationality fight", () => {
    expect(classify("Nikola Tesla", ["Nationality he was born in Smiljan"])).toBe("nationality");
  });
  it("spots pure vandalism cleanup", () => {
    expect(classify("Some Page", ["rvv", "blanking by IP"])).toBe("vandalism");
  });
  it("falls back to general", () => {
    expect(classify("Hot dog", ["restore long-standing wording"])).toBe("general");
  });
  it("counts war vs vandal signals", () => {
    expect(warSignals(["rv per consensus, this is POV push"])).toBeGreaterThan(0);
    expect(vandalSignals(["revert vandalism / rvv"])).toBeGreaterThan(0);
  });
});

describe("scoreBeef", () => {
  it("boosts genuine disputes and penalizes vandalism cleanup", () => {
    const base = { reverts: 4, editors: 3, velocity: 2 };
    const dispute = scoreBeef({ ...base, war: 3, vandal: 0 });
    const cleanup = scoreBeef({ ...base, war: 0, vandal: 3 });
    expect(dispute).toBeGreaterThan(cleanup);
  });
});

function change(title: string, user: string, comment: string, minute: number): RawChange {
  return { title, ns: 0, user, timestamp: `2026-06-22T10:${String(minute).padStart(2, "0")}:00Z`, comment, tags: ["mw-reverted"], revid: minute };
}

describe("processChanges", () => {
  const changes: RawChange[] = [
    // a real nationality war — many editors, dispute signals
    change("Nikola Tesla", "Editor1", "/* Nationality */ rv, Serbian per consensus", 5),
    change("Nikola Tesla", "Editor2", "/* Nationality */ he was Croatian, born in Smiljan", 22),
    change("Nikola Tesla", "Editor3", "rv POV push, see talk", 40),
    change("Nikola Tesla", "Editor1", "restore consensus version", 58),
    // a vandalism cleanup — should rank lower despite reverts
    change("Glass", "IPuser", "rvv blanking", 12),
    change("Glass", "IPuser", "revert vandalism, not constructive", 19),
    change("Glass", "IPuser", "rv test edit", 33),
    // a one-off (below minReverts) — dropped
    change("Helium", "Someone", "typo", 8),
  ];
  const report = processChanges(changes, { lang: "en", now: Date.parse("2026-06-22T11:00:00Z") });

  it("groups, filters single edits, and ranks the real war first", () => {
    expect(report.beefs[0]!.title).toBe("Nikola Tesla");
    expect(report.beefs.map((b) => b.title)).not.toContain("Helium");
    expect(report.pages).toBe(3);
    expect(report.total).toBe(8);
  });

  it("computes reverts, distinct editors, category, and a history url", () => {
    const tesla = report.beefs.find((b) => b.title === "Nikola Tesla")!;
    expect(tesla.reverts).toBe(4);
    expect(tesla.editors).toBe(3); // Editor1 twice
    expect(tesla.category).toBe("nationality");
    expect(tesla.velocity).toBeGreaterThan(0);
    expect(tesla.historyUrl).toBe("https://en.wikipedia.org/w/index.php?title=Nikola%20Tesla&action=history");
    expect(tesla.quotes.length).toBeGreaterThan(0);
  });

  it("ranks the genuine dispute above the vandalism cleanup", () => {
    const tesla = report.beefs.find((b) => b.title === "Nikola Tesla")!;
    const glass = report.beefs.find((b) => b.title === "Glass")!;
    expect(tesla.score).toBeGreaterThan(glass.score);
    expect(glass.category).toBe("vandalism");
  });
});

describe("crawlReverts", () => {
  function stub(pages: unknown[]) {
    const urls: string[] = [];
    let i = 0;
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      const body = pages[Math.min(i++, pages.length - 1)];
      return { ok: true, status: 200, json: async () => body } as Response;
    }) as typeof fetch;
    return { fetchImpl, urls };
  }

  it("requests the reverted-edits feed for the chosen language + namespace", async () => {
    const { fetchImpl, urls } = stub([{ query: { recentchanges: [] } }]);
    await crawlReverts({ lang: "de", ns: 0, fetchImpl, now: Date.parse("2026-06-22T12:00:00Z") });
    expect(urls[0]).toContain("https://de.wikipedia.org/w/api.php");
    expect(urls[0]).toContain("rctag=mw-reverted");
    expect(urls[0]).toContain("rcnamespace=0");
    expect(urls[0]).toContain("origin=*");
  });

  it("follows continuation and maps items to RawChange", async () => {
    const { fetchImpl } = stub([
      { query: { recentchanges: [{ title: "A", ns: 0, user: "u1", timestamp: "t1", comment: "c1", tags: ["mw-reverted"], revid: 1 }] }, continue: { rccontinue: "NEXT" } },
      { query: { recentchanges: [{ title: "B", ns: 0, user: "u2", timestamp: "t2", comment: "c2", tags: ["mw-reverted"], revid: 2 }] } },
    ]);
    const out = await crawlReverts({ fetchImpl });
    expect(out.map((c) => c.title)).toEqual(["A", "B"]);
    expect(out[0]).toMatchObject({ user: "u1", comment: "c1" });
  });
});
