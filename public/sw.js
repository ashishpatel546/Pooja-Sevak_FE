// Minimal service worker — required for installability (beforeinstallprompt)
// on Chrome/Android. No offline caching is implemented yet.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Network passthrough.
});
