const CACHE_NAME = 'idv-tracker-v7';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './challenge.html',
  './tier.html',
  './predict.html',
  './sync-guide.html',
  './guide.html',
  './install-guide.html',
  './base.css',
  './style.css',
  './tier-style.css',
  './challenge-style.css',
  './predict-style.css',
  './guide-style.css',
  './install-guide-style.css',
  './sync-guide-style.css',
  './app.js',
  './shared.js',
  './tier-app.js',
  './challenge-app.js',
  './predict-app.js'
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ネットワーク優先、失敗時にキャッシュ
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
