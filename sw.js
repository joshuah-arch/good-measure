// Offline support for Good Measure. The build stamps CACHE with a version so each release gets a fresh cache.
const CACHE = 'good-measure-e161e4d10388';
const SHELL = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];

self.addEventListener('install',event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate',event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('good-measure-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch',event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  // Store lookups and other sites always go to the network.
  if (new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    // The page: newest copy when online, the saved copy when offline.
    event.respondWith(fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put('./index.html',copy)));
      }
      return response;
    }).catch(() => caches.match('./index.html').then(saved => saved || caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(request).then(saved => saved || fetch(request)));
});
