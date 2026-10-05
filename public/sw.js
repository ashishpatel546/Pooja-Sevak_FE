// Service worker: makes the app installable (beforeinstallprompt on Chrome/Android)
// and shows Web Push notifications. No offline caching is implemented yet.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Network passthrough.
});

// Payload from the backend (PushService): { title, body, link, tag }.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Pooja Sevak';
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body: data.body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.tag || undefined,
        data: { link: data.link || '/' },
      }),
      // Open tabs refresh their bell right away instead of waiting for the next poll.
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clients) => clients.forEach((c) => c.postMessage({ type: 'notifications:changed' }))),
    ]),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let target;
  try {
    target = new URL((event.notification.data && event.notification.data.link) || '/', self.location.origin);
  } catch {
    target = new URL('/', self.location.origin);
  }
  if (target.protocol !== 'https:' && target.origin !== self.location.origin) {
    target = new URL('/', self.location.origin);
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (target.origin === self.location.origin) {
        // Reuse an open tab of the app when there is one.
        const tab = clients.find((c) => new URL(c.url).origin === self.location.origin);
        if (tab) {
          return tab.focus().then((c) => (c && 'navigate' in c ? c.navigate(target.href) : undefined));
        }
      }
      return self.clients.openWindow(target.href);
    }),
  );
});
