// AES-GCM helpers for encrypting OAuth tokens before they touch the database.
// Used by Microsoft 365 OAuth callback + refresh + graph-probe edge functions.
// Never invoke from browser code. Never return decrypted tokens to clients.

const KEY_VERSION = "v1";

function getRawKey(): Uint8Array {
  const raw = Deno.env.get("OAUTH_TOKEN_ENCRYPTION_KEY") ?? "";
  if (!raw) throw new Error("OAUTH_TOKEN_ENCRYPTION_KEY not configured");
  // Accept base64 or plain string >=32 chars; hash to 32 bytes via SHA-256 if needed.
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  } catch (_) {
    bytes = new TextEncoder().encode(raw);
  }
  return bytes;
}

async function importKey(): Promise<CryptoKey> {
  const raw = getRawKey();
  // Normalize to 32 bytes via SHA-256 — accepts any length encryption secret.
  const digest = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function b64encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function b64decode(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

export interface CiphertextEnvelope {
  v: string; // key version
  iv: string; // base64 12-byte IV
  ct: string; // base64 ciphertext
}

export async function encryptToken(plain: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain),
  );
  const env: CiphertextEnvelope = {
    v: KEY_VERSION,
    iv: b64encode(iv),
    ct: b64encode(ct),
  };
  return JSON.stringify(env);
}

export async function decryptToken(envelope: string): Promise<string> {
  const env = JSON.parse(envelope) as CiphertextEnvelope;
  const key = await importKey();
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64decode(env.iv) },
    key,
    b64decode(env.ct),
  );
  return new TextDecoder().decode(pt);
}

export const TOKEN_KEY_VERSION = KEY_VERSION;