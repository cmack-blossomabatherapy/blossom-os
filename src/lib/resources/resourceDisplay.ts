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
// "… page 3", "… page 3 of 7"
const TRAILING_PAGE_RE = /\s+page\s+\d+(?:\s+of\s+\d+)?\s*$/i;
// Noise substrings introduced by the manifest exporter that appear AFTER the
// leading order prefix has been stripped, e.g. `02 Source Document readiness…`
// or `03 Training Academ 018 billing…` or `01 Binder Sections templates…`.
const NOISE_PREFIX_RE = /^\s*\d{1,3}\s+(?:Source\s+Document|Training\s+Academ(?:y)?|Onboarding|Binder\s+Sections)(?:\s+\d{1,4})?\s+/i;
// After stripping noise the title is often lowercase — title-case it while
// preserving common ABA/tech acronyms.
const ACRONYMS = new Set([
  "SOP","CR","VOB","RBT","BCBA","HR","PTO","EMR","QA","EOB","OON","IEP","BIP",
  "ABA","ID","IT","AI","CEO","COO","CFO","VP","DOO","POC","KPI","OKR","FAQ",
  "NC","GA","TN","VA","MD","US","USA",
]);
function smartTitleCase(input: string): string {
  const smallWords = new Set(["a","an","and","as","at","but","by","for","in","of","on","or","the","to","vs","with"]);
  const parts = input.split(/\s+/);
  return parts
    .map((word, i) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      const clean = word.replace(/[^A-Za-z]/g, "");
      if (!clean) return word;
      // Preserve already-mixed-case words (Blossom, CentralReach, McDonald).
      if (/[a-z][A-Z]/.test(word) || (/[A-Z]/.test(word.slice(1)) && word[0] === word[0].toUpperCase())) return word;
      if (i > 0 && smallWords.has(word.toLowerCase())) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function cleanResourceTitle(title: string | null | undefined): string {
  if (!title) return "";
  let t = String(title).trim();
  // Strip file extension first so any "_.pdf" patterns don't survive.
  t = t.replace(TRAILING_EXT_RE, "");
  t = t.replace(LEADING_RESOURCE_ID_RE, "");
  // Strip noise/order prefixes repeatedly until stable.
  for (let i = 0; i < 6; i++) {
    const before = t;
    if (LEADING_RESOURCE_ID_RE.test(t)) t = t.replace(LEADING_RESOURCE_ID_RE, "");
    if (NOISE_PREFIX_RE.test(t)) t = t.replace(NOISE_PREFIX_RE, "");
    if (LEADING_ORDER_RE.test(t)) t = t.replace(LEADING_ORDER_RE, "");
    if (WEEK_DAY_RE.test(t)) t = t.replace(WEEK_DAY_RE, "");
    if (t === before) break;
  }
  // Strip trailing "page N" markers created by page-split PDFs.
  t = t.replace(TRAILING_PAGE_RE, "");
  // Normalize underscores/dashes to spaces, collapse whitespace.
  t = t.replace(/[_]+/g, " ").replace(/\s{2,}/g, " ").trim();
  // Remove dangling leading punctuation.
  t = t.replace(/^[\-–—:·.]+\s*/, "").trim();
  if (/^screen capture( \d+)?$/i.test(t)) return t.replace(/\b\w/g, (m) => m.toUpperCase());
  // If the result is all lowercase (common after manifest strips), title-case it.
  if (t && t === t.toLowerCase()) t = smartTitleCase(t);
  else t = smartTitleCase(t); // still fix embedded acronyms
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
