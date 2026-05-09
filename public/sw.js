/* Blossom OS push service worker */
const CATEGORY_FALLBACKS = {
  authorizations: "/authorizations",
  qa: "/qa",
  staffing: "/staffing",
  intake: "/leads",
  billing: "/finance-dashboard",
  compliance: "/qa-dashboard",
  tasks: "/tasks",
};

function safeDeepLink(raw, category) {
  const fallback = (category && CATEGORY_FALLBACKS[String(category).toLowerCase()]) || "/dashboard";
  if (typeof raw !== "string") return fallback;
  let v = raw.trim();
  if (!v) return fallback;
  if (v.length > 512) v = v.slice(0, 512);
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return fallback;
  if (v.startsWith("//") || v.startsWith("/\\")) return fallback;
  if (!v.startsWith("/")) return fallback;
  if (/[\u0000-\u001F\u007F]/.test(v)) return fallback;
  return v;
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { title: "Critical alert", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Critical alert";
  const safeUrl = safeDeepLink(data.url, data.category);
  const options = {
    body: data.body || "",
    data: { url: safeUrl, alertId: data.alertId, category: data.category },
    icon: "/blossom-logo-full.png",
    badge: "/blossom-logo-full.png",
    tag: data.alertId || undefined,
    renotify: true,
    requireInteraction: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const d = event.notification.data || {};
  const targetUrl = safeDeepLink(d.url, d.category);
  const alertId = d.alertId;
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      try {
        const url = new URL(client.url);
        if (url.origin === self.location.origin) {
          await client.focus();
          client.postMessage({ type: "PUSH_NAVIGATE", url: targetUrl, alertId });
          return;
        }
      } catch (_e) {}
    }
    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});