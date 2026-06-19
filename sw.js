/* Service Worker: macht die App offline-fähig (App-Shell + React/Babel werden zwischengespeichert). */
const CACHE = "ferrari360-tracker-v1";
const LOCAL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
const CDN = [
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone/babel.min.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // App-Shell muss klappen; CDN nur "best effort" (falls beim ersten Mal offline)
    await c.addAll(LOCAL);
    await Promise.allSettled(CDN.map((u) => c.add(new Request(u, { mode: "no-cors" }))));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    try {
      const res = await fetch(e.request);
      // Erfolgreiche GETs nachträglich cachen
      if (e.request.method === "GET" && res && (res.ok || res.type === "opaque")) {
        const c = await caches.open(CACHE);
        c.put(e.request, res.clone());
      }
      return res;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});
