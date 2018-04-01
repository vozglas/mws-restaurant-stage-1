const staticCacheName = 'rest-review-v4';
 
self.addEventListener('install', event => {
    /* console.log('install'); */
    
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
            return cache.addAll([
                '/',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/restaurant_info.js',
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
                    return cacheName != staticCacheName
                }).map(cacheName => {
                    caches.delete(cacheName);
                })
            )
        })
    )
})

self.addEventListener('fetch', function(event) { 
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response !== undefined) {
                return response;
            } else {
                return fetch(event.request).then(newResponse => {
                    let responseClone = newResponse.clone();
                    return caches.open(staticCacheName).then(cache => {
                        cache.put(event.request, responseClone);
                    }).then(()=> {
                        return newResponse
                    })
                }).catch(error => {
                return 'Error!';
                })
            }
        })
    )
});

self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
})