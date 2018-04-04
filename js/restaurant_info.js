
let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  //registerSW();
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {

    return DBHelper.fetchRestaurantById(id).then(restaurant => {
      self.restaurant = restaurant;
      if (!restaurant) {
        error = 'Restaurant not found!'
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    }).catch(error => {
      console.log(error);
    })
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const picture = document.getElementById('restaurant-picture');
  
  const picSourceBig = document.createElement('source');
  const bigPictureSrc = DBHelper.imageUrlForRestaurant(restaurant);
  picSourceBig.setAttribute('srcset', bigPictureSrc);
  picture.appendChild(picSourceBig);
  picSourceBig.setAttribute('media', '(min-width: 1200px), (min-width: 650px) and (max-width: 849px)');
  picture.appendChild(picSourceBig);

  const picSourceMedium = document.createElement('source');
  const mediumPictureSrc = DBHelper.imageUrlForRestaurant(restaurant, 'medium');
  picSourceMedium.setAttribute('srcset', mediumPictureSrc);
  picture.appendChild(picSourceMedium);
  picSourceMedium.setAttribute('media', '(min-width: 850px) and (max-width: 1199px), (min-width: 500px) and (max-width: 649px)');
  picture.appendChild(picSourceMedium);

  const picSourceSmall = document.createElement('source');
  const smallPictureSrc = DBHelper.imageUrlForRestaurant(restaurant, 'small');
  picSourceSmall.setAttribute('srcset', smallPictureSrc);
  picture.appendChild(picSourceSmall);
  picSourceSmall.setAttribute('media', '(max-width: 499px)');
  picture.appendChild(picSourceSmall);

  const img = document.createElement('img');
  img.style.width = "100%";
  img.style.borderRadius = "5% 0";
  img.setAttribute("alt", `Restaurant ${restaurant.name}`)
  picture.appendChild(img);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  const reviewHead = document.createElement('div');
  const reviewHeadBack = document.createElement('div');

  name.className = 'review-name';
  name.innerHTML = review.name;

  const date = document.createElement('p');
  date.className = 'review-date';
  date.innerHTML = review.date;

  reviewHead.className = 'review-head';
  reviewHead.appendChild(name);
  reviewHead.appendChild(date);
  reviewHeadBack.className = 'review-head-back';
  reviewHeadBack.innerHTML = 'corner';
  
  li.appendChild(reviewHeadBack);
  li.appendChild(reviewHead);
  

  const rating = document.createElement('p');
  rating.className = 'review-rating';
  rating.setAttribute('aria-label', `${review.name} rated this restaurant ${review.rating} stars out of 5`);

  const stars = document.createElement('span');
  stars.setAttribute('aria-hidden', true);
  stars.className = 'rating-stars';
  
  const noStars = document.createElement('span');
  noStars.setAttribute('aria-hidden', true);
  noStars.className = 'rating-no-stars';

  let strStars = "";
  let strNoStars = "";
  for (let i=0; i< review.rating; i++) {
    strStars += "★";
  }
  stars.innerHTML = strStars;
  
  for (let i=0; i < (5 - review.rating); i++) {
    strNoStars += "★";
  }
  noStars.innerHTML = strNoStars;

  rating.appendChild(stars);
  rating.appendChild(noStars);

  //rating.innerHTML = strStars;/* `Rating: ${review.rating}`; */
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = 'review-comments';
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
