const cahceVersion = "1";  

const staticCacheName = 'rest-review-v' + cahceVersion; 
const imageCache = 'rest-images-v' + cahceVersion;
const mapCache = 'rest-map-v' + cahceVersion;

const allCaches = [staticCacheName, imageCache, mapCache]; 
 

self.addEventListener('install', event => {
    console.log('install');
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/restaurant.html',
                '/js/dbhelper.js',
                '/js/idb.js',
                '/js/main.js',
                '/js/modal.js',
                '/js/restaurant_info.js',
                '/js/sw_reg.js',
                '/css/main.css',
                '/css/modal.css',
                '/css/rest_info.css',
                '/manifest.webmanifest',
                'https://fonts.googleapis.com/css?family=Roboto'
            ]);
        }).catch(error => {
            console.log(error)
        })
    )
}) 

self.addEventListener('activate', event => {
    console.log('activate');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return !allCaches.includes(cacheName);
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            )
        })
    )
})

self.addEventListener('fetch', function(event) {
    const requestUrl = new URL(event.request.url);
    /* console.log(requestUrl.pathname); */
    
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
    }).catch(error => {
        console.log(`error getting photo: ${error}`)
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
    }).catch(error => {
        console.log(`error getting map: ${error}`)
    })
} 