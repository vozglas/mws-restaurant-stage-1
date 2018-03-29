/* Register SW */
registerSW = () => {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.register('/sw.js').then(function(reg) {
        if (!navigator.serviceWorker.controller) {
          return;
        }
        
        if (reg.waiting) {
          updateWorker(reg.waiting);
          return;
        }
  
        if (reg.installing) {
          trackWorker(reg.installing);
          return;
        }
  
        reg.addEventListener('updatefound', () => {
          trackWorker(reg.installing);
          return;
        })
  
        trackWorker = (worker) => {
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') {
              updateWorker(worker);
            }
          })
        }
    
        updateWorker = (worker) => {
          worker.postMessage({action: 'skipWaiting'});
        }
        
        // Ensure refresh is only called once.
        // This works around a bug in "force update on reload".
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          window.location.reload(true);
          refreshing = true;
        })
      }).catch(function() {
        console.log('Registration failed!');
      });
    }
  }