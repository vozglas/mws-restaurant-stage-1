
/**
 * Common database helper functions.
 */
class DBHelper {
  static get DATABASE_URL() {
    const port = 1337; 
    return `http://localhost:${port}`; 
  }

  /* IDB */
  static openRestIdb() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
  
    return idb.open('restDB', 2, function(upgradeDb) {
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
          const reviewsStore = upgradeDb.createObjectStore('reviews', { keyPath: 'id', autoIncrement:true });
          reviewsStore.createIndex('reviews', 'restaurant_id');   
        case 1:
          upgradeDb.createObjectStore('reviewAction', { keyPath: 'id'})
      }
    });
  }


/*---------------------------------------------- MAIN PAGE--------------------------------------------------------------------------*/
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return DBHelper.openRestIdb().then(db => {
      if (!db) return DBHelper.getAllRestaurantsFromNetwork();
      return db.transaction('restaurants').objectStore('restaurants').getAll();
    })
  }

  static getAllRestaurantsFromNetwork() {
    return fetch(`${this.DATABASE_URL}/restaurants/`).then(response => {
      return response.json();
    }).catch(error => {
      console.log(`fetch restaurants from network error!`);
      console.log(error);
    })
  }

  static updateRestDB(dbArray = []) {
    let update = false;
    return DBHelper.openRestIdb().then(db => {
      if (db) {
        return DBHelper.getAllRestaurantsFromNetwork().then(restaurants => {
          let arrToAdd = restaurants.filter(elem => {
            return DBHelper.checkArray(dbArray, elem);
          });
          for (const rest of arrToAdd) {
            update = true;
            db.transaction('restaurants', 'readwrite').objectStore('restaurants').put(rest);
          }
          return update;      
        })
      }
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

/*--------------------------------------------- RESTAURANT INFO PAGE----------------------------------------------------------------*/
  static fetchReviewsByRestaurantId(restaurantId) {
    return DBHelper.openRestIdb().then(db => {
      if(db) {
        return db.transaction('reviews').objectStore('reviews').index('reviews').getAll(restaurantId);
      }
    });
  }

  static getAllReviewsFromNetwork(restaurantId) {
    return fetch(`${this.DATABASE_URL}/reviews/?restaurant_id=${restaurantId}`).then(reviews => {
      // here we're 100% online. fire failed requests!
      return DBHelper.executeFailedRequests().then(response => {
        return reviews.json();
      });
    }).catch(error => {
      console.log(`fetch reviews from network error!`);
      console.log(error);
    })
  }

  static updateReviewsDB(dbArray = [], restaurantId) {
    let update = false;
    return DBHelper.openRestIdb().then(db => {
      if (db) {
        return DBHelper.getAllReviewsFromNetwork(restaurantId).then(reviews => {
          let arrToAdd = reviews.filter(elem => {
            return DBHelper.checkArray(dbArray, elem);
          });
          for (const review of arrToAdd) {
            update = true;
            db.transaction('reviews', 'readwrite').objectStore('reviews').put(review);
          }
          return update;      
        })
      }
    })
  } 


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    return DBHelper.openRestIdb().then(db => {
      if (!db) {
        return fetch(`${this.DATABASE_URL}/restaurants/${id}`).then(response => {
              return response.json();
            }).catch(error => {
              console.log(`${error}: Fetch restaurant by ID error!`)
            })        
      } else {
        // get restaurant from DB
        return db.transaction('restaurants').objectStore('restaurants').get(parseInt(id)).then(rest => {
          if (!rest) {
            // if not found then fetch from network
           return fetch(`${this.DATABASE_URL}/restaurants/${id}`).then(response => {
              // add to DB and return
              return response.json().then(restaurant => {
                return db.transaction('restaurants', 'readwrite').objectStore('restaurants').put(restaurant).then(() => {
                  return restaurant;
                })
              })
            })
          } else {
            return rest;
          }
        }).catch(error => {
            console.log(`Fetch restaurant by ID error!`)
          })      
        }
    })
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  // Add new review
  static addNewReview(review) {
    return DBHelper.openRestIdb().then(db => {
      if (db) {
        // 1. write review to IDB
        db.transaction('reviews', 'readwrite').objectStore('reviews').put(review).then(reviewId => {
          // 2. write action to temp object store (id, action)
          db.transaction('reviewAction', 'readwrite').objectStore('reviewAction').put({'id': reviewId, 'action': 'newReview'}).then(response => {
            // 3. POST to network
            DBHelper.postReviewNetwork(review).then(response => {
              // 4. CREATED 201 OK ? delete from temp object store : leave it until we're online and post
              if (response.status >= 200 && response.status < 300) {
                DBHelper.deleteAction(db, reviewId);
              }
            })
          })
        }).catch(error => {
          console.log(error);
        })
      }
    })
  }

  static postReviewNetwork(review) {
    return fetch(`${this.DATABASE_URL}/reviews` , {
      method: 'POST',
      body: JSON.stringify(review)
    });
  }

  static deleteReview(reviewId) {
    // 1. delete review from IDB
    
    // 2. write action to temp object store (object type, id, action)

    // 3. DELETE 

    // 4. 200 OK ? delete from temp object store : leave it until we're online


  }

  static deleteReviewNetwork(reviewId) {

  }

  // delete failed request from TMP objectStore
  static deleteAction(db, actionId) {
    if (db) db.transaction('reviewAction', 'readwrite').objectStore('reviewAction').delete(actionId);
  }

  // execute failed requests when we're finaly online
  static executeFailedRequests() {
    return DBHelper.openRestIdb().then(db => {
      if (db) {
        db.transaction('reviewAction').objectStore('reviewAction').getAll().then(response=> {
          for (const action of response) {
            switch(action.action) {
              case "newReview" : {
                return db.transaction('reviews').objectStore('reviews').get(action.id).then(review => {
                  return DBHelper.postReviewNetwork(review).then(response => {
                    if (response.status >= 200 && response.status < 300) {
                      DBHelper.deleteAction(db, action.id);
                    }
                  });
                }).catch(error => {
                  console.log(error);
                })
              }
              case "deleteReview": DBHelper.deleteReviewNetwork(reviewId);
                break;
              }
            }
          return Promise.resolve();
        })
      }
    })
  }

/*--------------------------------------------- OTHER ----------------------------------------------------------------*/  
  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, size = '') {
    if (restaurant.photograph === undefined) {return (`/img/no_image`)}
    switch(size) {
      case 'small':
        return (`/img/${restaurant.photograph}_small`);
        break;
      case 'medium':
        return (`/img/${restaurant.photograph}_medium`);
        break;
      default:
        return (`/img/${restaurant.photograph}`);
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
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  static checkArray(arrayToCheck, elem) {
    let addElem = true;
    for (const checkElem of arrayToCheck) {
      if (checkElem.id === elem.id)  addElem = false;
    }
    return addElem;
  }  
}

