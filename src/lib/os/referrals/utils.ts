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

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 0) return d.toLocaleDateString();
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return d.toLocaleDateString();
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}