/* 小小便利店 · Service Worker（离线缓存） */
const CACHE = 'mini-mart-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './assets/bg.jpg',
  './assets/water.png', './assets/riceball.png', './assets/noodle.png',
  './assets/chips.png', './assets/cola.png', './assets/coffee.png', './assets/magazine.png',
  './assets/customer1.png', './assets/customer2.png', './assets/customer3.png',
  './assets/customer4.png', './assets/customer5.png',
  './assets/cashier.png', './assets/stocker.png', './assets/cleaner.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      if (res.ok && e.request.url.startsWith(self.location.origin)) {
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
