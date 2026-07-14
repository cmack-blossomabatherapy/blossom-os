/**
 * Resource Library display helpers.
 *
 * Resource Library uploads frequently arrive with administrative/order
 * prefixes baked into the filename (`34 W2D4 Operational Prioritization
 * SOP.pdf`). Internal IDs/filenames stay untouched — these helpers only
 * sanitize the visible learner/admin string.
 */
import type { Resource, ResourceCategoryId } from "@/lib/resources/resourceData";

// "34 ", "07-", "12_"
const LEADING_ORDER_RE = /^\s*\d{1,3}\s*[\s\-_.]+/;
const LEADING_RESOURCE_ID_RE = /^\s*RFO-\d{3,}\s*(?:[-–—:]\s*)?/i;
// "W2D4", "W2 D4", "W2-D4", "W2 · D4"
const WEEK_DAY_RE = /^\s*W\s*[1-5]\s*[·\-–—\s.]*\s*D\s*[1-7]\b\s*[\-–—:·.\s_]*/i;
const TRAILING_EXT_RE = /\.(pdf|docx?|pptx?|xlsx?|csv|txt|md|key|pages|numbers|png|jpe?g|webp|gif|mp4|mov|m4v|webm|zip)$/i;

export function cleanResourceTitle(title: string | null | undefined): string {
  if (!title) return "";
  let t = String(title).trim();
  // Strip file extension first so any "_.pdf" patterns don't survive.
  t = t.replace(TRAILING_EXT_RE, "");
  t = t.replace(LEADING_RESOURCE_ID_RE, "");
  // Strip leading order prefix.
  for (let i = 0; i < 3; i++) {
    const before = t;
    if (LEADING_RESOURCE_ID_RE.test(t)) t = t.replace(LEADING_RESOURCE_ID_RE, "");
    if (LEADING_ORDER_RE.test(t)) t = t.replace(LEADING_ORDER_RE, "");
    if (WEEK_DAY_RE.test(t)) t = t.replace(WEEK_DAY_RE, "");
    if (t === before) break;
  }
  // Normalize underscores/dashes to spaces, collapse whitespace.
  t = t.replace(/[_]+/g, " ").replace(/\s{2,}/g, " ").trim();
  // Remove dangling leading punctuation.
  t = t.replace(/^[\-–—:·.]+\s*/, "").trim();
  if (/^screen capture( \d+)?$/i.test(t)) return t.replace(/\b\w/g, (m) => m.toUpperCase());
  return t;
}

function isWeakDescription(description: string | null | undefined): boolean {
  const d = (description ?? "").trim();
  return !d || d === "—" || d === "-" || /^uploaded resource$/i.test(d) || /^resource$/i.test(d);
}

export function resourceDisplayDescription(r: Pick<Resource, "title" | "description" | "type" | "departments" | "resourceType" | "category">): string {
  if (!isWeakDescription(r.description)) return String(r.description).trim();

  const title = cleanResourceTitle(r.title);
  const dept = (r.departments ?? []).find(Boolean);
  const area = dept ? ` for ${dept}` : "";

  if (r.type === "Video" || r.resourceType === "video") return `A walkthrough video${area}${title ? ` covering ${title.toLowerCase()}` : ""}.`;
  if (r.type === "SOP" || r.resourceType === "sop") return `Step-by-step operating guidance${area}${title ? ` for ${title.toLowerCase()}` : ""}.`;
  if (r.type === "Template" || r.resourceType === "template") return `A reusable template${area}${title ? ` for ${title.toLowerCase()}` : ""}.`;
  if (r.type === "Checklist" || r.resourceType === "checklist" || r.resourceType === "cheat_sheet") return `A quick checklist/reference${area}${title ? ` for ${title.toLowerCase()}` : ""}.`;
  if (r.resourceType === "role_packet") return `Role-specific reference materials${area}${title ? ` for ${title.toLowerCase()}` : ""}.`;
  if (r.category === "training" || r.resourceType === "training") return `Training material${area}${title ? ` for ${title.toLowerCase()}` : ""}.`;
  return `A Blossom resource${area}${title ? ` for ${title.toLowerCase()}` : ""}.`;
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
