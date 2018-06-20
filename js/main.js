
let restaurants,
neighborhoods,
cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */

document.addEventListener('DOMContentLoaded', (event) => {
  registerSW();
  fetchNeighborhoods();
  fetchCuisines();
  //DBHelper.fetchAllReviews();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods().then(neighborhoods => {
    self.neighborhoods = neighborhoods;
    fillNeighborhoodsHTML();
  }).catch(error => {
    console.log(error);
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  for (const neighborhood of neighborhoods) {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  }
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines().then(cuisines => {
    self.cuisines = cuisines;
    fillCuisinesHTML();
  }).catch(error => {
    console.log(error);
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  for (const cuisine of cuisines) {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  }
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
updateRestaurants = (isFavorite = false) => {
  
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, isFavorite).then(restaurants => {
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
    lazyLoad();
    // updating restaurants DB from network
    DBHelper.updateRestDB(restaurants).then(update => {
      // reload restaurants if DB was updated
      if (update === true) updateRestaurants();
    });
  }).catch(error => {
    console.log(error);
  });
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
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const mainWrap = document.createElement('div');

  const imgWrap = document.createElement('div');
  imgWrap.className = 'lazy-img';
  imgWrap.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant, 'small'))
  imgWrap.setAttribute('data-alt', restaurant.name);
  mainWrap.append(imgWrap);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  mainWrap.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  mainWrap.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
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

/************************* 
* Lazy-loading pictures
*************************/
const config = {
  // If the image gets within 50px in the Y axis, start the download.
  rootMargin: '50px 0px',
  threshold: 0.01
};
let observer = new IntersectionObserver(onIntersection, config);

// Get all of the elements that are marked up to lazy load
lazyLoad = () => {
  const images = document.querySelectorAll('.lazy-img');
  if (!('IntersectionObserver' in window)) {
      // no oberver. load all pictures 
      console.log('no observer');
      for (const image of images) {
        loadImage(image);
      }
    } else {
      for (const image of images) {
        observer.observe(image);
      }
    }
}

function onIntersection(entries) {
for (const entry of entries) {
  if (entry.intersectionRatio > 0) {
    // Stop watching and load the image
    observer.unobserve(entry.target);
    loadImage(entry.target);
  }
}
}

loadImage = (image_src) => {
  const picContainer = document.createElement('picture');
  const imageWebP = document.createElement('source');
  imageWebP.setAttribute('srcset' , image_src.dataset.src + '.webp');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = image_src.dataset.src + '.jpg';
  image.setAttribute("alt", `Restaurant ${image_src.dataset.alt}`)

  picContainer.append(imageWebP);
  picContainer.append(image);

  image_src.append(picContainer);
}



