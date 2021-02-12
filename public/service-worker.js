const CACHE_NAME = "my-budget-cache-v1";
const DATA_CACHE_NAME = "data-budget-cache-v1";

const FILES_TO_CACHE = [
  "/",
  "/css/styles.css",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
  "/js/idb.js",
  "/js/index.js",
  "/index.html",
  "/manifest.json",
];

// adding an event listener in order to install the service worker
self.addEventListener("install", function (e) {
  // wait until the work is complete before terminating the service worker.
  e.waitUntil(
    // find the specific cache by name, then add every file in the FILES_TO_CACHE array to the cache.
    caches.open(CACHE_NAME).then((cache) => {
      console.log("installing cache : " + CACHE_NAME);
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate the service worker and remove old data from the cache
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercept fetch requests
self.addEventListener("fetch", function (e) {
  if (e.request.url.includes("/api/")) {
    e.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then((cache) => {
          return fetch(e.request)
            .then((response) => {
              // if the response was good, clone it and store in cache
              if (response.status === 200) {
                cache.put(e.request.url, response.clone());
              }
              return response;
            })
            .catch((err) => {
              // network request failed, try to get it from cache
              return cache.match(e.request);
            });
        })
        .catch((err) => console.log(err))
    );
    return;
  }
  // For non api requests, assume it's for static files
  e.respondWith(
    fetch(e.request).catch(function () {
      return caches.match(e.request).then(function (response) {
        if (response) {
          return response;
        } else if (e.request.headers.get("accept").includes("txt/html")) {
          // return the caches homepage for all requests for html pages
          return caches.match("/");
        }
      });
    })
  );
});
