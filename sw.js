// v2 — réseau d'abord : sert toujours la dernière version quand il y a du
// réseau, et ne retombe sur le cache que hors-ligne. Change CACHE_NAME à
// chaque nouvelle version pour forcer le nettoyage des caches précédents
// (utile après les problèmes de version bloquée en v1).
const CACHE_NAME = 'famille-shell-v2';
const SHELL_FILES = ['./index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Réseau d'abord pour la coquille (HTML/CSS/JS) : on va toujours chercher
// la dernière version en ligne, et on ne sert le cache qu'en dépannage
// si le réseau échoue (mode hors-ligne).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
