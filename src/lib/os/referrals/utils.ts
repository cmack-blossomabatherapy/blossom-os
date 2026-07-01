/** Normalize a company name for matching. */
export function normalizeCompanyName(name: string | null | undefined): string {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Extract a normalized domain from email or website URL. */
export function extractDomain(email?: string | null, website?: string | null): string | null {
  if (email && email.includes("@")) {
    const d = email.split("@")[1]?.trim().toLowerCase();
    if (d && !/(gmail|yahoo|hotmail|outlook|aol|icloud|live|me|msn)\./i.test(d)) return d;
  }
  if (website) {
    try {
      const url = website.startsWith("http") ? website : `https://${website}`;
      const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
      if (host) return host;
    } catch { /* ignore */ }
  }
  return null;
}

export function safeDate(v: unknown): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime()) || d.getFullYear() < 1990 || d.getFullYear() > 2100) return null;
  return d.toISOString();
}

export function safeInt(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = parseInt(String(v).replace(/[^0-9-]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

// Marketing dates render in ET / en-US so every viewer sees the same
// "last contacted" label regardless of browser locale or timezone.
export function fmtRelative(iso: string | null | undefined): string {
  return fmtMktgRelative(iso);
}

export function fmtDate(iso: string | null | undefined): string {
  return fmtMktgDate(iso);
}

/**
 * Canonical timezone/locale for Marketing surfaces. Blossom operates across
 * ET states (GA, NC, TN, VA, MD) — pin display to America/New_York so a
 * "last contacted" timestamp reads the same for every user regardless of
 * where their browser sits.
 */
export const MKTG_TIMEZONE = "America/New_York";
export const MKTG_LOCALE = "en-US";

/** Short marketing date, e.g. "Mar 4". Consistent across Reputation & Referrals. */
export function fmtMktgShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(MKTG_LOCALE, {
    month: "short",
    day: "numeric",
    timeZone: MKTG_TIMEZONE,
  });
}

/** Full marketing date, e.g. "Mar 4, 2026". */
export function fmtMktgDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(MKTG_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: MKTG_TIMEZONE,
  });
}

/** Relative "last contacted" label (Today / 3d ago / Mar 4). ET-pinned fallback. */
export function fmtMktgRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 0) return fmtMktgShortDate(iso);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return fmtMktgShortDate(iso);
}