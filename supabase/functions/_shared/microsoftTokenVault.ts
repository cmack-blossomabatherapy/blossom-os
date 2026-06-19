// Shared Microsoft 365 token vault helpers.
// Loads the per-user encrypted vault row, refreshes the access token against
// Microsoft, and re-encrypts the rotated tokens. Used by both
// `microsoft-refresh-token` and `microsoft-graph-probe` so that no Edge
// Function entrypoint imports another Edge Function entrypoint.
import { encryptToken, decryptToken } from "./oauthTokenCrypto.ts";

const CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET") ?? "";
const TENANT = Deno.env.get("MICROSOFT_TENANT_ID") ?? "common";

export interface RefreshResult {
  ok: boolean;
  expires_at?: string | null;
  error?: string;
}

export async function refreshUserToken(
  supabase: any,
  userId: string,
): Promise<RefreshResult> {
  const { data: conn } = await supabase
    .from("integration_oauth_connections")
    .select("id")
    .eq("integration_id", "ms365")
    .eq("user_id", userId)
    .maybeSingle();
  if (!conn) return { ok: false, error: "no_connection" };

  const { data: vault } = await supabase
    .from("integration_oauth_token_vault")
    .select("refresh_token_ciphertext")
    .eq("oauth_connection_id", conn.id)
    .maybeSingle();
  if (!vault?.refresh_token_ciphertext) return { ok: false, error: "no_refresh_token" };

  let refreshToken: string;
  try {
    refreshToken = await decryptToken(vault.refresh_token_ciphertext);
  } catch (e) {
    return { ok: false, error: `decrypt_failed: ${e instanceof Error ? e.message : e}` };
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    await supabase
      .from("integration_oauth_connections")
      .update({
        status: "needs_attention",
        last_error: `refresh_failed: ${data?.error_description ?? data?.error ?? res.status}`,
      })
      .eq("id", conn.id);
    return { ok: false, error: data?.error_description ?? data?.error ?? "refresh_failed" };
  }

  const accessCipher = data.access_token ? await encryptToken(data.access_token) : null;
  const newRefreshCipher = data.refresh_token
    ? await encryptToken(data.refresh_token)
    : vault.refresh_token_ciphertext;
  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;

  await supabase
    .from("integration_oauth_token_vault")
    .update({
      access_token_ciphertext: accessCipher,
      refresh_token_ciphertext: newRefreshCipher,
      expires_at: expiresAt,
      last_refresh_at: new Date().toISOString(),
    })
    .eq("oauth_connection_id", conn.id);

  await supabase
    .from("integration_oauth_connections")
    .update({
      status: "connected",
      expires_at: expiresAt,
      last_error: null,
      last_connected_at: new Date().toISOString(),
    })
    .eq("id", conn.id);

  return { ok: true, expires_at: expiresAt };
}

/** SHA-256 hex hash of a raw OAuth state nonce. */
export async function hashOauthState(raw: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Generate a cryptographically random URL-safe state nonce. */
export function generateOauthStateNonce(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  // base64url
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}