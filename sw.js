const staticCacheName = 'rest-review-v1';
const imageCache = 'rest-images-v1';
const allCaches = [staticCacheName, imageCache];
 

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
    // images cache
    const requestUrl = new URL(event.request.url);
    if (requestUrl.pathname.startsWith('/img/')) {
        event.respondWith(servePhoto(event.request));
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