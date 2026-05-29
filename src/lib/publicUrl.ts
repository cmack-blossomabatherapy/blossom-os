/**
 * Public-facing base URL for links that live OUTSIDE the OS — NFC badges,
 * parent share links, QR codes printed on cards, etc. We never want these to
 * point at the sandbox/preview host (which is gated by Lovable auth).
 */
const ENV_BASE = (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined)?.trim();
const PROD_HOSTS = ["blossom.abacommandcenter.com", "blossom-os.lovable.app"];

function fromBrowser(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.host;
  // If we're already on a real production host, use it.
  if (PROD_HOSTS.some((h) => host.endsWith(h))) return window.location.origin;
  // Otherwise (preview / sandbox / localhost) fall through.
  return "";
}

export const PUBLIC_BASE_URL: string =
  ENV_BASE || fromBrowser() || "https://blossom.abacommandcenter.com";

/** URL written to a physical NFC tag. Prefers the short tag code over UUIDs. */
export function nfcBadgeUrl(codeOrId: string): string {
  return `${PUBLIC_BASE_URL.replace(/\/+$/, "")}/nfc/${encodeURIComponent(codeOrId)}`;
}