// Service Worker for Performance Optimization
const CACHE_NAME = 'etimad-mart-v1';
const STATIC_CACHE = 'static-v1';

// Cache static assets
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/trimmer.webp',
  '/beauty.webp',
  '/loadingCard.png'
];

// Cache API responses for short time
const API_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle GET; let POST/PUT/etc pass through to network
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Cache images with stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            // Serve from cache, update in background
            fetch(request).then(fetchResponse => {
              if (fetchResponse && fetchResponse.ok) {
                try { cache.put(request, fetchResponse.clone()); } catch (_) {}
              }
            }).catch(() => {});
            return response;
          }
          // Not in cache, fetch and cache
          return fetch(request).then(fetchResponse => {
            if (fetchResponse && fetchResponse.ok) {
              try { cache.put(request, fetchResponse.clone()); } catch (_) {}
            }
            return fetchResponse;
          }).catch(() => caches.match(request));
        });
      })
    );
    return;
  }
  // Default: network first, fallback to cache for everything else
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
