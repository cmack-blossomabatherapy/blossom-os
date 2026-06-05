/**
 * Hardens deep links coming from push payloads / DB rows so that clicking a
 * notification can never escape the app to another origin or trigger a
 * `javascript:` URL. Returns a safe in-app path beginning with `/`.
 *
 * Falls back to a category-aware landing page (or `/dashboard`) when the
 * supplied value is missing, malformed, protocol-relative, absolute to a
 * different origin, or otherwise unsafe.
 */
const CATEGORY_FALLBACKS: Record<string, string> = {
  authorizations: "/authorizations",
  qa: "/qa",
  staffing: "/staffing",
  intake: "/leads",
  billing: "/billing-finance",
  compliance: "/qa-workspace",
  tasks: "/tasks",
};

export function sanitizeDeepLink(
  raw: string | null | undefined,
  category?: string | null,
): string {
  const fallback =
    (category && CATEGORY_FALLBACKS[category.toLowerCase()]) || "/dashboard";

  if (typeof raw !== "string") return fallback;
  let value = raw.trim();
  if (!value) return fallback;
  if (value.length > 512) value = value.slice(0, 512);

  // Reject scheme-bearing URLs (javascript:, data:, http:, etc.).
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return fallback;

  // Reject protocol-relative ("//evil.com/...") and backslash variants.
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;

  // Must be an absolute in-app path.
  if (!value.startsWith("/")) return fallback;

  // Strip embedded control characters.
  if (/[\u0000-\u001F\u007F]/.test(value)) return fallback;

  return value;
}