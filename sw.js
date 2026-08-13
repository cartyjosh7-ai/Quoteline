// Quoteline service worker — caches only the app shell (this page + icons)
// so it opens instantly and works offline. It NEVER caches requests to the
// Google Apps Script API (a different origin) — pipeline data must always
// come from the network. Showing stale "who to call today" data offline
// would be actively misleading, so a network failure there should just
// surface the app's normal "couldn't reach your Sheet" error, not silently
// serve old numbers.

var CACHE_NAME = 'quoteline-shell-v1';
var SHELL_FILES = [
  './quoteline-app.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(SHELL_FILES); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // let the Sheet API request pass straight through, uncached

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
