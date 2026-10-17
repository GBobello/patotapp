// Service worker do PatotApp: apenas notificações push (RF48). Não faz cache nem funciona offline.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "PatotApp", {
      body: data.body || "Você tem uma novidade na sua patota.",
      icon: "/icons/192",
      badge: "/icons/192",
      lang: "pt-BR",
      tag: data.tag,
      data: { url: data.url || "/notificacoes" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/notificacoes", self.location.origin);
  // Só abre páginas do próprio app.
  const target = url.origin === self.location.origin ? url.href : self.location.origin + "/notificacoes";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) return open.navigate(target).then((w) => (w || open).focus());
      return self.clients.openWindow(target);
    }),
  );
});
