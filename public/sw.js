const CACHE_NAME = "cacaos-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // ❌ Only cache GET requests — HEAD, POST, OPTIONS crash cache.put()
  if (request.method !== "GET") return;

  // ⚡ Cache-first ONLY for static assets (JS, CSS, fonts, images)
  // Navigation/document requests are NOT intercepted — the app needs
  // to be online (Supabase), and intercepting pages causes crashes
  // when cache misses and network is unavailable.
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // For navigation, API calls, etc. — let the browser handle natively.
  // No event.respondWith() means the browser does a normal fetch.
});
