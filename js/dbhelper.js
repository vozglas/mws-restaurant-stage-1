
/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; 
    return `http://localhost:${port}`; 
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return fetch(`${this.DATABASE_URL}/restaurants`).then(response => {
      return response.json();
    }).catch(error => {
      console.log('Fetch Restaurants Error!')
    })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    return fetch(`${this.DATABASE_URL}/restaurants/${id}`).then(response => {
      return response.json();
    }).catch(error => {
      console.log(`Fetch restaurant by ID error!`)
    })
  }

  /**
   * Fetch restaurants by a cuisine type
   */
  static fetchRestaurantByCuisine(cuisine) {
    return DBHelper.fetchRestaurants().then(restaurants => {
      const results = restaurants.filter(r => r.cuisine_type == cuisine);
      return results;
    }).catch(error => {
      console.log(error);
    })
  }

  /**
   * Fetch restaurants by a neighborhood
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    return DBHelper.fetchRestaurants().then(restaurants => {
      const results = restaurants.filter(r => r.neighborhood == neighborhood);
      return results;
    }).catch(error => {
      console.log(error);
    })
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        return results;
    }).catch(error => {
      console.log(error);
    })
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    return DBHelper.fetchRestaurants().then(restaurants => {
      const allNeighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood).sort();
      return new Set(allNeighborhoods);
    }).catch(error => {
      console.log(error);
    })
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    return DBHelper.fetchRestaurants().then(restaurants => {
      const allCuisines = restaurants.map((v, i) => restaurants[i].cuisine_type).sort();
      return new Set(allCuisines);
    }).catch(error => {
      console.log(error);
    })
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, size = '') {
    if (restaurant.photograph === undefined) {return (`/img/no_image.jpg`)}
    switch(size) {
      case 'small':
        return (`/img/${restaurant.photograph}_small.jpg`);
        break;
      case 'medium':
        return (`/img/${restaurant.photograph}_medium.jpg`);
        break;
      default:
        return (`/img/${restaurant.photograph}.jpg`);
        break;
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP,
    content: '<div style="width: 100px; height: 100px; background-color: red;">test</div>'}
    );
    return marker;
  }

}
