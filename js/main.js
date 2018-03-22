
let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []



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

    }).catch(function() {
      console.log('Registration failed!');
    });

    // Ensure refresh is only called once.
    // This works around a bug in "force update on reload".
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      window.location.reload(true);
      refreshing = true;
    })
  }
}



/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */

document.addEventListener('DOMContentLoaded', (event) => {
  registerSW();
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
/* let i = 1; */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const mainWrap = document.createElement('div');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  //image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.src = DBHelper.smallImageUrlForRestaurant(restaurant);
  image.setAttribute("alt", `Restaurant ${restaurant.name}`)
  //li.append(image);
  mainWrap.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  //li.append(name);
  mainWrap.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  //li.append(neighborhood);
  mainWrap.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  //li.append(address);
  mainWrap.append(address);

  li.append(mainWrap);

  const moreWrap = document.createElement('div');
  moreWrap.className = 'more-wrap';
  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', `Read more about ${restaurant.name} restaurant.`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  moreWrap.append(more);
  li.append(moreWrap)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}