
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
          reviewsStore.createIndex('reviewsByIndex', 'restaurant_id');   
          upgradeDb.createObjectStore('reviewAction', { keyPath: 'id'});
        case 1:
          upgradeDb.createObjectStore('restaurantAction', { keyPath: 'id'});
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
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, isFavorite) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        if (isFavorite) { // filter by favorite
          results = results.filter(r => r.is_favorite == isFavorite);
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


  static getAllReviewsFromNetwork(restaurantId) {
    return fetch(`${this.DATABASE_URL}/reviews/?restaurant_id=${restaurantId}`).then(reviews => {
        return reviews.json();
    }).catch(error => {
      console.log(`fetch reviews from network error!`);
      console.log(error);
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

static fetchReviewsByRestaurantId(restaurantId) {
    return DBHelper.openRestIdb().then(db => {
      if(db) {
        return db.transaction('reviews').objectStore('reviews').index('reviewsByIndex').getAll(restaurantId);
      }
    });
  }

  // Create a new restaurant review
  static addNewReviewDB(review) {
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
      } else {
        DBHelper.postReviewNetwork(review);
      }
    })
  }

  static postReviewNetwork(review) {
    return fetch(`${this.DATABASE_URL}/reviews` , {
      method: 'POST',
      body: JSON.stringify(review)
    });
  }

  // Update estaurant review from network
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


  // Delete a restaurant review
  static deleteReviewDB(reviewId) {
    return DBHelper.openRestIdb().then(db => {
      if (db) {
        // 1. delete review from IDB
        return db.transaction('reviews', 'readwrite').objectStore('reviews').delete(parseInt(reviewId)).then(response => {
          // 2. write action to temp object store (id, action)
          db.transaction('reviewAction', 'readwrite').objectStore('reviewAction').put({'id': parseInt(reviewId), 'action': 'deleteReview'}).then(response => {
            // 3. DELETE on network
            DBHelper.deleteReviewNetwork(parseInt(reviewId)).then(response => {
              // 4. DELETED ? delete from temp object store : leave it until we're online and post
              if (response.status >= 200 && response.status < 300) {
                DBHelper.deleteAction(db, parseInt(reviewId));
              }
            })
          })
        }).catch(error => {
          console.log(error);
        })
      } else {
        DBHelper.deleteReviewNetwork(parseInt(reviewId));
      }
    })
  }

  static deleteReviewNetwork(reviewId) {
    return fetch(`${this.DATABASE_URL}/reviews/${parseInt(reviewId)}` , { method: 'DELETE' });
  }

  // delete failed request from TMP objectStore
  static deleteAction(db, actionId) {
    if (db) db.transaction('reviewAction', 'readwrite').objectStore('reviewAction').delete(parseInt(actionId));
  }

  // Favorite | Unfavorite restaurant
  static favoriteRestaurant(restaurant, isFavorite) {
    return DBHelper.openRestIdb().then(db => {
      if (db) {
        // 1. write action to temp object store (id, action)
        return db.transaction('restaurantAction', 'readwrite').objectStore('restaurantAction').put({'id': restaurant.id, 'action': isFavorite}).then(response => {
          // Update restaurant in objectStore
          restaurant.is_favorite = (isFavorite);
          return db.transaction('restaurants', 'readwrite').objectStore('restaurants').put(restaurant).then(response => {
            // 2. POST to network
              DBHelper.favoriteRestaurantNetwork(restaurant.id, isFavorite).then(response => {
              // 3.  OK ? delete action from temp object store : leave it until we're online and post
              if (response.status >= 200 && response.status < 300) {
                db.transaction('restaurantAction', 'readwrite').objectStore('restaurantAction').delete(parseInt(restaurant.id));
              }
              return restaurant;
            })
          })
        })
      } else {
        return DBHelper.favoriteRestaurantNetwork(restaurant.id, isFavorite);
      }
    })
  }

  static favoriteRestaurantNetwork(restaurantId, isFavorite) {
    return fetch(`${this.DATABASE_URL}/restaurants/${restaurantId}/?is_favorite=${isFavorite}` , {
      method: 'PUT'
    });
  }


  //Update a restaurant review
  static updateReview(review) {
    DBHelper.openRestIdb().then(db => {
      if (db) {
        // 1. update review in IDB
        db.transaction('reviews', 'readwrite').objectStore('reviews').put(review).then(response => {
          // 2. write action to temp object store (id, action)
          db.transaction('reviewAction', 'readwrite').objectStore('reviewAction').put({'id': parseInt(review.id), 'action': 'updateReview'}).then(response => {
            // 3. update review on network
            return DBHelper.updateReviewNetwork(review).then(response => {
              // 4. UPDATED ? delete from temp object store : leave it until we're online and post
              return db.transaction('reviewAction', 'readwrite').objectStore('reviewAction').delete(review.id);
            })
          })
        }).catch(error => {
          console.log(error);
        });
      } else {
        return updateReviewNetwork(review);
      }
    });
  }

  static updateReviewNetwork(review) {
    return fetch(`${this.DATABASE_URL}/reviews/${review.id}` , {
      method: 'PUT',
      body: JSON.stringify(review)
    });
  }

  // execute failed requests when we're finaly online
  static executeFailedRequests() {
    return DBHelper.openRestIdb().then(db => {
      if (db) {
        // add | delete | update reviews
        db.transaction('reviewAction').objectStore('reviewAction').getAll().then(response=> {
          for (const action of response) {
            switch(action.action) {
              case "newReview" : 
                return db.transaction('reviews').objectStore('reviews').get(action.id).then(review => {
                  return DBHelper.postReviewNetwork(review).then(response => {
                    if (response.status >= 200 && response.status < 300) {
                      DBHelper.deleteAction(db, action.id);
                    }
                  });
                }).catch(error => {
                  console.log(error);
                })
              case "deleteReview": 
                return DBHelper.deleteReviewNetwork(action.id).then(response => {
                  // 4. DELETED ? delete from temp object store : leave it until we're online and post
                  if ((response.status >= 200 && response.status < 300) || response.status === 404 /* not found in DB, so we don't need this action anymore */) {
                    DBHelper.deleteAction(db, action.id);
                  }
                }).catch(error => {
                  console.log(error);
                })
              case "updateReview":
                return db.transaction('reviews').objectStore('reviews').get(action.id).then(review => {
                  return DBHelper.updateReviewNetwork(review).then(response => {
                    // 4. UPDATED ? delete from temp object store : leave it until we're online and post
                    return db.transaction('reviewAction', 'readwrite').objectStore('reviewAction').delete(review.id);
                  })
                })
              }
            }
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
      //break;
    }
    return addElem;
  }  
}

