/* Service worker: guarda la app para que funcione sin internet. */
const VERSION = '2026-11-19-dd6a014e';
const CACHE = 'mates-pipa-' + VERSION;
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png', './voice/index.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('mates-pipa-') && k !== CACHE && k !== 'mates-pipa-voz-2').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (/\/voice\/[0-9a-f]+\.mp3$/.test(new URL(req.url).pathname)) {
    // voz grabada: se guarda la primera vez que suena y luego funciona sin internet
    e.respondWith(caches.open('mates-pipa-voz-2').then((c) => c.match(req.url.split('?')[0]).then((hit) => hit || fetch(req).then((res) => { if (res.ok) c.put(req.url.split('?')[0], res.clone()); return res; }))));
    return;
  }
  if (req.mode === 'navigate') {
    // primero lo guardado (arranque instantáneo y sin internet)
    e.respondWith(caches.open(CACHE).then((c) => c.match('./index.html').then((hit) => hit || fetch(req))).catch(() => fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
