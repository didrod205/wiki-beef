// Pure beef score. A page is "beefy" when many edits get reverted, by several
// editors, fast — and the summaries read like a content dispute, not cleanup.

export interface ScoreInput {
  reverts: number;
  editors: number;
  /** reverts per hour. */
  velocity: number;
  /** count of "real dispute" signals (per talk, POV, consensus…). */
  war: number;
  /** count of "just vandalism" signals (rvv, blanking, spam…). */
  vandal: number;
}

export function scoreBeef(b: ScoreInput): number {
  let s = b.reverts * 10 + b.editors * 6 + Math.min(b.velocity, 20) * 1.5;
  s += Math.min(b.war, 5) * 8; // genuine fights rank higher
  s -= Math.min(b.vandal, 5) * 6; // reverting vandalism isn't a war
  return Math.max(0, Math.round(s));
}
