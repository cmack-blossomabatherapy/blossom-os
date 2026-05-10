/**
 * PBKDF2(SHA-256) PIN hashing for the Employee Hub vault.
 * v1: client-side compute. Move to edge function for production-grade vault.
 */

const ITERATIONS = 100_000;

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64ToBuf(b64: string): ArrayBuffer {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out.buffer;
}

export function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bufToB64(arr.buffer);
}

export async function hashPin(pin: string, saltB64: string, iterations = ITERATIONS): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: b64ToBuf(saltB64),
      iterations,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return bufToB64(bits);
}

export async function verifyPin(
  pin: string,
  saltB64: string,
  expectedHashB64: string,
  iterations = ITERATIONS,
): Promise<boolean> {
  const got = await hashPin(pin, saltB64, iterations);
  if (got.length !== expectedHashB64.length) return false;
  let ok = 0;
  for (let i = 0; i < got.length; i++) ok |= got.charCodeAt(i) ^ expectedHashB64.charCodeAt(i);
  return ok === 0;
}

export const PIN_ITERATIONS = ITERATIONS;