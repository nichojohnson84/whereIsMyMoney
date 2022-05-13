const CACHE_NAME = 'static-cache-v2';
const DATA_CACHE_NAME = 'data-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/css/bootstrap.min.css',
  '/assets/css/style.css',
  '/assets/icons/icon-72x72.png',
  '/assets/icons/icon-96x96.png',
  '/assets/icons/icon-128x128.png',
  '/assets/icons/icon-144x144.png',
  '/assets/icons/icon-152x152.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-384x384.png',
  '/assets/icons/icon-512x512.png',
  '/assets/js/index.js',
  '/assets/js/indexedDB.js',
];

// Install Service Worker
self.addEventListener('install', function (evt) {
  evt.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Your files were pre-cached successfully!');
        cache
          // Pre-Cache Static Files
          .addAll(FILES_TO_CACHE)
          .then((result) => {
            // Success
            console.log('result of add all', result);
          })
          .catch((err) => {
            // Error
            console.log('Add all error: ', err);
          });
      })
      .catch((err) => {
        console.log(err);
      })
  );
  // Activiate immediately once done
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', function (evt) {
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('Removing old cache data', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

//fetch
self.addEventListener('fetch', function (evt) {
  if (evt.request.url.includes('/api/')) {
    evt.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then((cache) => {
          return fetch(evt.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }

              return response;
            })
            .catch((err) => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        })
        .catch((err) => console.log(err))
    );

    return;
  }

  evt.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(evt.request).then((response) => {
        return response || fetch(evt.request);
      });
    })
  );
});
