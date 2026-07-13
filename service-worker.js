/*
 * service-worker.js — Football Live Pro (updated)
 * bumped VERSION to force clients to update cache during development
 */

const VERSION = "flp-v1.0.1";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const API_CACHE = `${VERSION}-api`;

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/config.js",
  "./js/i18n.js",
  "./js/storage.js",
  "./js/api.js",
  "./js/ui.js",
  "./js/router.js",
  "./js/notifications.js",
  "./js/app.js",
  "./js/pages/home.js",
  "./js/pages/live.js",
  "./js/pages/matches.js",
  "./js/pages/leagues.js",
  "./js/pages/favorites.js",
  "./js/pages/settings.js",
  "./js/pages/match-details.js",
  "./js/pages/team.js",
  "./js/pages/player.js",
  "./js/pages/search.js",
  "./icons/icon-72.png",
  "./icons/icon-96.png",
  "./icons/icon-128.png",
  "./icons/icon-144.png",
  "./icons/icon-152.png",
  "./icons/icon-192.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png",
  "./icons/maskable-icon-192.png",
  "./icons/maskable-icon-512.png",
  "./icons/placeholder-team.svg",
  "./icons/placeholder-league.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("flp-") && ![SHELL_CACHE, RUNTIME_CACHE, API_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isApiRequest(url) {
  return url.hostname.includes("api-sports.io") || url.hostname.includes("api-football");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // API requests -> network-first
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(req, API_CACHE, 20000));
    return;
  }

  if (url.origin === self.location.origin) {
    if (SHELL_ASSETS.some((a) => req.url.endsWith(a.replace("./", "/")))) {
      event.respondWith(cacheFirst(req, SHELL_CACHE));
      return;
    }
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }

  // Cross-origin static (fonts, team logos from API's CDN, etc.)
  event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return cached || new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

async function networkFirst(req, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
    ]);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || new Response(JSON.stringify({ errors: ["offline"], response: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Notification click -> focus/open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./index.html");
    })
  );
});
