import { supabase } from "@/integrations/supabase/client";

const SW_URL = "/sw.js";

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Avoid registering on Lovable preview iframes / preview hosts. */
export function isAllowedHostForPush(): boolean {
  if (typeof window === "undefined") return false;
  if (window.top !== window.self) return false;
  const host = window.location.hostname;
  if (host.startsWith("id-preview--")) return false;
  return true;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported() || !isAllowedHostForPush()) return null;
  const existing = await navigator.serviceWorker.getRegistration(SW_URL);
  if (existing) return existing;
  return await navigator.serviceWorker.register(SW_URL, { scope: "/" });
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const reg = await ensureServiceWorker();
  if (!reg) return null;
  return await reg.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: "Push notifications are not supported in this browser." };
  if (!isAllowedHostForPush()) return { ok: false, reason: "Open the published app (not the preview) to enable push." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "Notification permission was not granted." };

  const reg = await ensureServiceWorker();
  if (!reg) return { ok: false, reason: "Service worker unavailable." };

  const { data: keyData, error: keyErr } = await supabase.functions.invoke("push-public-key");
  if (keyErr || !keyData?.publicKey) return { ok: false, reason: "Could not load VAPID public key." };

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
    });
  }

  const { error } = await supabase.functions.invoke("push-subscribe", {
    body: { subscription: subscription.toJSON(), userAgent: navigator.userAgent },
  });
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function unsubscribeFromPush(): Promise<{ ok: boolean; reason?: string }> {
  const sub = await getCurrentSubscription();
  if (!sub) return { ok: true };
  try {
    await supabase.functions.invoke("push-unsubscribe", { body: { endpoint: sub.endpoint } });
  } catch (_e) {}
  await sub.unsubscribe();
  return { ok: true };
}