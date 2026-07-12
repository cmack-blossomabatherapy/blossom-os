// Phone number utilities for click-to-call and CTM matching.

/** Strip everything except digits and leading +. */
export function digitsOnly(v: string | null | undefined): string {
  if (!v) return "";
  const trimmed = String(v).trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/[^\d]/g, "");
}

/**
 * Normalize a US-centric phone number to E.164 (+1XXXXXXXXXX).
 * Returns "" if fewer than 10 digits after stripping.
 * Non-US numbers with a leading + are preserved as-is.
 */
export function toE164(v: string | null | undefined): string {
  if (!v) return "";
  const raw = String(v).trim();
  if (raw.startsWith("+")) return "+" + raw.slice(1).replace(/[^\d]/g, "");
  const d = raw.replace(/[^\d]/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (d.length < 10) return "";
  return `+${d}`;
}

/** Human-friendly formatting for US numbers, fallback to raw for others. */
export function formatPhoneDisplay(v: string | null | undefined): string {
  if (!v) return "";
  const e164 = toE164(v);
  if (e164.startsWith("+1") && e164.length === 12) {
    const d = e164.slice(2);
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return e164 || String(v);
}

/** Build a tel: URI safe for GoIntegrator / native dialers. */
export function telHref(v: string | null | undefined): string {
  const e164 = toE164(v);
  return e164 ? `tel:${e164}` : "";
}
