const staticCacheName = 'rest-review-v2';
const imageCache = 'rest-images-v2';
const mapCache = 'rest-map-v2';
const allCaches = [staticCacheName, imageCache, mapCache];
 

self.addEventListener('install', event => {
    /* console.log('install'); */
    
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/restaurant.html',
                '/sw.js',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/restaurant_info.js',
                '/js/sw_reg.js',
                '/js/idb.js',
                '/js/lazy-load.js',
                '/css/styles.css',
                '/manifest.webmanifest',
                'https://fonts.googleapis.com/css?family=Roboto'
            ]);
        }).catch(error => {
            console.log(error)
        })
    )
}) 

self.addEventListener('activate', event => {
    /* console.log('activate'); */
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return !allCaches.includes(cacheName);
                }).map(cacheName => {
                    caches.delete(cacheName);
                })
            )
        })
    )
})

self.addEventListener('fetch', function(event) { 
    const requestUrl = new URL(event.request.url);
    
    if (requestUrl.origin === location.origin) {
    // images cache
        if (requestUrl.pathname.startsWith('/img/')) {
            event.respondWith(servePhoto(event.request));
            return;
        }

        if (requestUrl.pathname.startsWith('/restaurant')) {
          event.respondWith(caches.match('/restaurant.html'));
          return;
        }

        if (requestUrl.pathname.startsWith('/index')) {
            event.respondWith(caches.match('/index.html'));
            return;
        }
    }
    
    // maps cache
    if (requestUrl.origin.includes('/maps.')) {
        event.respondWith(serveMaps(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    )
});

self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
})

servePhoto = (request) => {
    return caches.open(imageCache).then(cache => {
        return cache.match(request.url).then(response => {
            if (response) return response;

            return fetch(request).then(networkResponse => {
                cache.put(request.url, networkResponse.clone());
                return networkResponse;
            })
        })
    })
}

serveMaps = (request) => {
    // no need to cache request, that checks API key, 'cause it will go to google server anyway
    if (!request.origin.includes('QuotaService.RecordEvent')) {
        return cache.match(request.url).then(response => {
            if (response) return response;
            return fetch(request).then(networkResponse => {
                cache.put(request.url, networkResponse.clone());
                return networkResponse;
            })
        })
    } else {
        return fetch(request).then(response => {
            return response;
        })
    }
}