const CACHE_NAME = 'tv-game-night-v25';
const APP_SHELL = [
  './',
  './index.html',
  './404.html',
  './script.js',
  './manifest.webmanifest',
  './Icone/favicon.svg',
  './Icone/logo.png',
  './Icone/icon-192.png',
  './Icone/apple-touch-icon.png',
  './Icone_syst/home.png',
  './Icone_syst/replay.png',
  './Icone_syst/terminal.png',
  './Icone_syst/wireless-symbol.png',
  './host.html',
  './play.html',
  './privacy-policy.html',
  './termini-condizioni.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(response => {
        if (!response || !response.ok) {
          return caches.match('./index.html').then(cached => cached || fetch('./index.html'));
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('./index.html', responseToCache));
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return undefined;
      });
    })
  );
});
