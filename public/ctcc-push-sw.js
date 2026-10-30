self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = {}; }
  const title = payload.title || "KroniX Control Center";
  const options = {
    body: payload.body || "Hay una novedad que requiere atención.",
    tag: payload.tag || "kronix-ctcc",
    renotify: true,
    requireInteraction: true,
    data: { url: payload.url || "/ruta-kronix/operations" },
    vibrate: [500, 180, 500, 180, 700],
  };
  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => clients.forEach((client) => client.postMessage({ type: "KRONIX_PUSH_SOUND" }))),
  ]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/ruta-kronix/operations", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
    for (const client of clients) {
      client.postMessage({ type: "KRONIX_PUSH_STOP" });
      if ("focus" in client && client.url.startsWith(self.location.origin)) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  }));
});
