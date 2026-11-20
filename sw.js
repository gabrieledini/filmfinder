/* Cineteca — Service Worker
 * Strategie:
 *  - App shell (HTML/CSS/JS/manifest/icone)  → cache-first con aggiornamento in background
 *  - Font Google                              → stale-while-revalidate
 *  - Immagini TMDb (image.tmdb.org)           → cache-first con cap LRU
 *  - API TMDb (api.themoviedb.org)            → network-only (dati sempre freschi)
 */
const VERSION    = 'v3-2026-11-20';
const SHELL_CACHE  = `cineteca-shell-${VERSION}`;
const FONTS_CACHE  = `cineteca-fonts-${VERSION}`;
const IMG_CACHE    = `cineteca-img-${VERSION}`;
const IMG_MAX      = 200; // max poster/foto in cache

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

/* ---------- install: pre-cache app shell ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* ---------- activate: pulizia vecchie versioni ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, FONTS_CACHE, IMG_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !keep.has(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* ---------- helpers ---------- */
async function trimCache(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  if (keys.length <= max) return;
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) {
    // refresh in background (lazy update)
    fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); }).catch(()=>{});
    return hit;
  }
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return hit || Response.error();
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const networkPromise = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || networkPromise;
}

/* ---------- fetch router ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // 1) API TMDb: passa sempre alla rete (no cache stale di ricerche/dettagli)
  if (url.hostname === 'api.themoviedb.org') return;

  // 2) Immagini TMDb: cache-first con LRU cap
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith((async () => {
      const res = await cacheFirst(req, IMG_CACHE);
      trimCache(IMG_CACHE, IMG_MAX);
      return res;
    })());
    return;
  }

  // 3) Google Fonts (css + woff): stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req, FONTS_CACHE));
    return;
  }

  // 4) Navigazione (SPA-style): prova rete, fallback all'app shell offline
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        // aggiorna copia in cache
        const c = await caches.open(SHELL_CACHE);
        c.put('./index.html', res.clone());
        return res;
      } catch {
        const c = await caches.open(SHELL_CACHE);
        return (await c.match('./index.html')) || (await c.match('./')) || Response.error();
      }
    })());
    return;
  }

  // 5) Tutto il resto same-origin: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req, SHELL_CACHE));
    return;
  }
});

/* ---------- messaggi (per "aggiorna ora") ---------- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
