/* Blossom OS push service worker */
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
  const options = {
    body: data.body || "",
    data: { url: data.url || "/", alertId: data.alertId, category: data.category },
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
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      try {
        const url = new URL(client.url);
        if (url.origin === self.location.origin) {
          await client.focus();
          client.postMessage({ type: "PUSH_NAVIGATE", url: targetUrl });
          return;
        }
      } catch (_e) {}
    }
    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});