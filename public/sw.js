// NOTE: Update APP_VERSION in app.js when changing version
const CACHE_NAME = 'tasbihku-v1.7.5';

// File utama yang WAJIB ada saat offline
const urlsToCache = [
  '/',
  '/index.html',
  '/404.html',
  '/assets/index.css',
  '/assets/index.js',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/config.json',
  '/sound.ogg'
];

// Event: Install Service Worker dan Cache file statis
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate new SW immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Event: Activate (Bersihkan cache lama jika ada update)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim all open clients immediately
  );
});

// Event: Fetch (Cegat request network)
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Strategi khusus untuk Google Fonts (Cache First, Network Fallback)
  if (requestUrl.origin.includes('fonts.googleapis.com') ||
    requestUrl.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) return response;
          return fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Strategi: Stale-While-Revalidate (serve cache immediately, update in background)
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Only cache successful same-origin responses
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse); // If network fails, fall back to cache

        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Event: Notification Click (Open or focus the PWA window with routing)
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = event.notification.data || {};
  let targetUrl = '/';
  
  if (data.type === 'dzikir-pagi') {
    targetUrl = '/#page-player-pagi';
  } else if (data.type === 'dzikir-petang') {
    targetUrl = '/#page-player-petang';
  } else if (data.type === 'timer-finished') {
    targetUrl = '/#page-dashboard-timer';
  } else if (data.habitId) {
    targetUrl = '/#page-dashboard-habit';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (let client of clientList) {
        if ('navigate' in client) {
          return client.navigate(targetUrl).then(c => c.focus());
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});