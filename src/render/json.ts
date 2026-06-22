import type { BeefReport } from "../types.js";

export function toJSON(report: BeefReport): string {
  return JSON.stringify(report, null, 2);
}
