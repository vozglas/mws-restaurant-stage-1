const staticCacheName = 'rest-review-v1';
const imageCache = 'rest-images-v1';
const mapCache = 'rest-map-v1';
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
                '/css/styles.css',
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
    
    // images cache
    if (requestUrl.pathname.startsWith('/img/')) {
        event.respondWith(servePhoto(event.request));
        return;
    }

    // maps cache
    if (requestUrl.origin.includes('/maps.')) {
        event.respondWith(serveMaps(event.request));
        return;
    }



    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname.startsWith('/restaurant')) {
          event.respondWith(caches.match('/restaurant.html'));
          return;
        }

        if (requestUrl.pathname.startsWith('/index')) {
            event.respondWith(caches.match('/index.html'));
            return;
        }
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
    return caches.open(mapCache).then(cache => {
        return cache.match(request.url).then(response => {
            if (response) return response;

            return fetch(request).then(networkResponse => {
                cache.put(request.url, networkResponse.clone());
                return networkResponse;
            })
        })
    })
}