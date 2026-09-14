const CACHE_NAME = 'app-cache-v10.8'; // תעלה את הגרסה כאן כל פעם שאתה מעדכן קבצים

const ASSETS_TO_CACHE = [
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// מוחק את המטמון הישן מיידית
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// אסטרטגיה מעודכנת: מנסה קודם כל להביא את הקובץ העדכני מהרשת, ואם אין אינטרנט - לוקח מהקאש
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // אם ההבאה מהרשת הצליחה, נשמור עותק מעודכן בקאש ונחזיר למשתמש
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // מחפש בקאש, ואם גם שם אין - מחזיר תגובת Response ריקה או שגיאה תקינה במקום undefined
        return caches.match(e.request).then((cachedResponse) => {
          return cachedResponse || new Response('Network error & not in cache', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
