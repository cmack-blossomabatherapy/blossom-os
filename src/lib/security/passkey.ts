/**
 * WebAuthn / passkey wrapper for the Employee Hub vault.
 * Returns `notSupported` outcomes when the browser lacks the API,
 * so the UI can fall back to PIN cleanly.
 */

export type PasskeyResult =
  | { ok: true; credentialId: string }
  | { ok: false; reason: "notSupported" | "cancelled" | "error"; message?: string };

export type PasskeyRegistration =
  | { ok: true; credentialId: string; publicKey: string }
  | { ok: false; reason: "notSupported" | "cancelled" | "error"; message?: string };

export function isPasskeyAvailable(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isPasskeyAvailable()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Trigger a platform-authenticator (Face ID / Touch ID / Windows Hello)
 * verification using a previously stored credential id.
 * v1: this is a presence check only; full server-side challenge verification
 * lives in a future edge function.
 */
export async function verifyWithPasskey(credentialIdB64?: string | null): Promise<PasskeyResult> {
  if (!isPasskeyAvailable()) return { ok: false, reason: "notSupported" };
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const allow = credentialIdB64
      ? [{
          id: Uint8Array.from(atob(credentialIdB64), (c) => c.charCodeAt(0)),
          type: "public-key" as const,
        }]
      : undefined;
    const cred = (await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: "required",
        allowCredentials: allow,
        timeout: 30_000,
      },
    })) as PublicKeyCredential | null;
    if (!cred) return { ok: false, reason: "cancelled" };
    return { ok: true, credentialId: cred.id };
  } catch (e: any) {
    if (e?.name === "NotAllowedError") return { ok: false, reason: "cancelled" };
    return { ok: false, reason: "error", message: e?.message };
  }
}

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * Register a new platform / roaming security key (passkey) for the current user.
 * v1: stores credential id + public key locally — full attestation verification
 * lives in a future edge function.
 */
export async function registerPasskey(opts: {
  userId: string;
  userName: string;
  displayName: string;
  rpName?: string;
}): Promise<PasskeyRegistration> {
  if (!isPasskeyAvailable()) return { ok: false, reason: "notSupported" };
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userIdBytes = new TextEncoder().encode(opts.userId);
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: opts.rpName ?? "Blossom OS" },
        user: {
          id: userIdBytes,
          name: opts.userName,
          displayName: opts.displayName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },   // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          userVerification: "preferred",
          residentKey: "preferred",
        },
        timeout: 60_000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;
    if (!cred) return { ok: false, reason: "cancelled" };
    const response = cred.response as AuthenticatorAttestationResponse;
    const pk = response.getPublicKey?.();
    const publicKey = pk ? bufToB64(pk) : "";
    return { ok: true, credentialId: cred.id, publicKey };
  } catch (e: any) {
    if (e?.name === "NotAllowedError") return { ok: false, reason: "cancelled" };
    return { ok: false, reason: "error", message: e?.message };
  }
}