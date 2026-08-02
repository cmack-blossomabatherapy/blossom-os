/** Shared CentralReach procedure-code helpers. */

export const CODE_DIRECT = "97153";
export const CODE_SUPERVISION = "97155";
export const CODE_PARENT_TRAINING = "97156";
export const CODE_ASSESSMENT = "97151";

/** Extract the canonical 5-character CPT code from a raw code/description. */
export function normalizeCode(raw: string | null | undefined): string {
  if (!raw) return "";
  const m = String(raw).match(/\b(\d{5}|[0-9]{4}[A-Z])\b/);
  return m ? m[1] : String(raw).trim();
}

export function isCode(raw: string | null | undefined, code: string): boolean {
  return normalizeCode(raw) === code;
}

export function hoursOf(n: number | null | undefined): number {
  return Number.isFinite(Number(n)) ? Number(n) : 0;
}

/** Voided / deleted / non-billable statuses that must never count. */
export function isCountableStatus(status: string | null | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase();
  if (!s) return true;
  return !/void|deleted|denied\s*duplicate|cancel/.test(s);
}