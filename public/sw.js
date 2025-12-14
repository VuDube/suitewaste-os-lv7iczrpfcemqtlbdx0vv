/* --------------------------------------------------------------
 * SuiteWaste OS – Service Worker (pure Cache API, no Workbox)
 * --------------------------------------------------------------
 *
 * This Service Worker implements:
 *  • Precaching of build assets (Vite injects self.__WB_MANIFEST)
 *  • Cache‑first for Google Fonts stylesheets & webfonts
 *  • Stale‑while‑revalidate for API requests (/api/*)
 *  • Cache‑first for image requests
 *  • Network‑first navigation with an offline fallback page
 *  • Push‑notification handling (unchanged)
 *
 * All logic uses the native Cache API only, avoiding Workbox imports
 * which are incompatible with Cloudflare Workers’ sandbox.
 */

/* --------------------------- Cache Names --------------------------- */
const PRECACHE = 'precache-v1';
const API_CACHE = 'api-cache';
const IMAGE_CACHE = 'image-cache';
const FONT_STYLESHEET_CACHE = 'google-fonts-stylesheets';
const FONT_WEBFONT_CACHE = 'google-fonts-webfonts';

/* --------------------------- Install ----------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // Vite injects an array like [{url: '/index.html', revision: '...'}, ...]
      if (self.__WB_MANIFEST && Array.isArray(self.__WB_MANIFEST)) {
        const urls = self.__WB_MANIFEST.map((entry) => entry.url || entry);
        await cache.addAll(urls);
      }
    })()
  );
});

/* --------------------------- Activate --------------------------- */
self.addEventListener('activate', (event) => {
  const expectedCaches = [
    PRECACHE,
    API_CACHE,
    IMAGE_CACHE,
    FONT_STYLESHEET_CACHE,
    FONT_WEBFONT_CACHE,
  ];
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (!expectedCaches.includes(name)) {
            return caches.delete(name);
          }
        })
      );
    })()
  );
});

/* ---------------------- Helper Strategies ----------------------- */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    })
    .catch(() => null);
  return cachedResponse || networkPromise;
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;
  const networkResponse = await fetch(request);
  cache.put(request, networkResponse.clone());
  return networkResponse;
}

/* --------------------------- Fetch ------------------------------ */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Navigation (HTML) – network first, fallback to offline message
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preload = await event.preloadResponse;
          if (preload) return preload;
          return await fetch(request);
        } catch (err) {
          return new Response(
            'You are offline. Some functionality may be unavailable.',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
      })()
    );
    return;
  }

  // Google Fonts stylesheets
  if (url.origin === 'https://fonts.googleapis.com') {
    event.respondWith(cacheFirst(request, FONT_STYLESHEET_CACHE));
    return;
  }

  // Google Fonts webfonts
  if (url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, FONT_WEBFONT_CACHE));
    return;
  }

  // API calls – stale‑while‑revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Images – cache‑first
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }
});

/* ---------------------- Push Notifications ---------------------- */
self.addEventListener('push', (event) => {
  const data = event.data
    ? event.data.json()
    : { title: 'SuiteWaste OS', body: 'You have a new notification.' };
  const options = {
    body: data.body,
    icon: 'https://placehold.co/192x192/050505/00FF41/png?text=SW',
    badge: 'https://placehold.co/96x96/050505/00FF41/png?text=SW',
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});
//