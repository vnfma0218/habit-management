self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();

  const title = data.title || "Habit Reminder";
  const options = {
    body: data.body || "오늘 루틴을 확인해보세요.",
    icon: "/next.svg",
    badge: "/next.svg",
    data: { url: data.url || "/home" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/home";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return null;
    })
  );
});
