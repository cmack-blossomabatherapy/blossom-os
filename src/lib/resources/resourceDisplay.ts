/**
 * Resource Library display helpers.
 *
 * Resource Library uploads frequently arrive with administrative/order
 * prefixes baked into the filename (`34 W2D4 Operational Prioritization
 * SOP.pdf`). Internal IDs/filenames stay untouched — these helpers only
 * sanitize the visible learner/admin string.
 */
import type { ResourceCategoryId } from "@/lib/resources/resourceData";

// "34 ", "07-", "12_"
const LEADING_ORDER_RE = /^\s*\d{1,3}\s*[\s\-_.]+/;
// "W2D4", "W2 D4", "W2-D4", "W2 · D4"
const WEEK_DAY_RE = /^\s*W\s*[1-5]\s*[·\-–—\s.]*\s*D\s*[1-7]\b\s*[\-–—:·.\s_]*/i;
const TRAILING_EXT_RE = /\.(pdf|docx?|pptx?|xlsx?|csv|txt|md|key|pages|numbers|png|jpe?g|webp|gif|mp4|mov|m4v|webm|zip)$/i;

export function cleanResourceTitle(title: string | null | undefined): string {
  if (!title) return "";
  let t = String(title).trim();
  // Strip file extension first so any "_.pdf" patterns don't survive.
  t = t.replace(TRAILING_EXT_RE, "");
  // Strip leading order prefix.
  for (let i = 0; i < 3; i++) {
    const before = t;
    if (LEADING_ORDER_RE.test(t)) t = t.replace(LEADING_ORDER_RE, "");
    if (WEEK_DAY_RE.test(t)) t = t.replace(WEEK_DAY_RE, "");
    if (t === before) break;
  }
  // Normalize underscores/dashes to spaces, collapse whitespace.
  t = t.replace(/[_]+/g, " ").replace(/\s{2,}/g, " ").trim();
  // Remove dangling leading punctuation.
  t = t.replace(/^[\-–—:·.]+\s*/, "").trim();
  return t;
}

export interface InferOptions {
  tags?: string[];
  fallback?: ResourceCategoryId;
}

export function inferResourceCategoryFromTitle(
  title: string,
  opts: InferOptions = {},
): ResourceCategoryId {
  const t = `${title} ${(opts.tags ?? []).join(" ")}`.toLowerCase();
  if (/\b(w[1-5]d[1-7]|state director|launch|new state|state ops)\b/.test(t)) return "leadership";
  if (/\bhandbook|policy|policies|pto|benefit/.test(t)) return "hr";
  if (/\brecruit|hiring|interview|candidate/.test(t)) return "operational";
  if (/\b(centralreach|central reach|retell|tango|portal|systems?)\b/.test(t)) return "systems";
  if (/\bauth(orization)?|vob|eob|payer|insurance/.test(t)) return "insurance";
  if (/\bschedul/.test(t)) return "workflows";
  if (/\btemplate|letter|form\b/.test(t)) return "templates";
  if (/\bscript|message|email|sms|comm/.test(t)) return "communication";
  if (/\btraining|academy|module|onboarding/.test(t)) return "training";
  if (/\bworkflow|process|pipeline/.test(t)) return "workflows";
  if (/\bsop\b/.test(t)) return "sops";
  return opts.fallback ?? "operational";
}

export function resourceDisplayTitle(r: { title: string | null | undefined }): string {
  return cleanResourceTitle(r?.title);
}
