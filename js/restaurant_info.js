
let restaurant;
var map;

registerSW();

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
  

  picture.appendChild(makePictureSource(restaurant, "", '.webp', '(min-width: 1200px), (min-width: 650px) and (max-width: 849px)'));
  picture.appendChild(makePictureSource(restaurant, "medium", '.webp', '(min-width: 850px) and (max-width: 1199px), (min-width: 500px) and (max-width: 649px)'));
  picture.appendChild(makePictureSource(restaurant, "small", '.webp', '(max-width: 499px)'));
  picture.appendChild(makePictureSource(restaurant, "", '.jpg', '(min-width: 1200px), (min-width: 650px) and (max-width: 849px)'));
  picture.appendChild(makePictureSource(restaurant, "medium", '.jpg', '(min-width: 850px) and (max-width: 1199px), (min-width: 500px) and (max-width: 649px)'));
  picture.appendChild(makePictureSource(restaurant, "small", '.jpg', '(max-width: 499px)'));

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

// create source for <picture>
makePictureSource = (restaurant, picSize = "", picExtension, mediaQuery) => {
  const picSource = document.createElement('source');
  const picSrcSet = DBHelper.imageUrlForRestaurant(restaurant, picSize) + picExtension;
  picSource.setAttribute('srcset', picSrcSet);
  picSource.setAttribute('media', mediaQuery);
  return picSource;
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
  
  if (reviews) {
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  } else {
    const noReviews = document.createElement('p');
    noReviews.className = "no-review";
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
  }

  addReviewForm();
}

// add review form
addReviewForm = () => {
  const container = document.getElementById('reviews-container');

  const title = document.createElement('h4');
  title.innerHTML = 'Write a review';

  const newReviewWrap = document.createElement('div');
  newReviewWrap.className = 'new-review-wrap';

  const newReviewAuthor = document.createElement('input');
  newReviewAuthor.setAttribute('id', 'newReviewAuthor');
  newReviewAuthor.className = 'new-review-author';
  const newReviewAuthorLabel = document.createElement('label');
  newReviewAuthorLabel.htmlFor = 'newReviewAuthor';
  newReviewAuthorLabel.innerHTML = 'Your name: ';
  newReviewAuthorLabel.className = 'new-review-labels';
  

  const newReviewText = document.createElement('textarea');
  newReviewText.className = 'new-review-text';
  newReviewText.setAttribute('id', 'newReviewText');
  newReviewText.rows = 5;
  const newReviewTextLabel = document.createElement('label');
  newReviewTextLabel.htmlFor = 'newReviewText';
  newReviewTextLabel.innerHTML = 'Your review: ';
  newReviewTextLabel.className = 'new-review-labels';
  
  const newReviewRating = document.createElement('select');
  newReviewRating.className = 'new-review-rating';
  newReviewRating.setAttribute('id', 'newReviewRating');
  const newReviewRatingLabel = document.createElement('label');
  newReviewRatingLabel.htmlFor = 'newReviewRating';
  newReviewRatingLabel.innerHTML = 'Your rating: ';
  newReviewRatingLabel.className = 'new-review-labels';
  for (let i = 0; i < 6; i++) {
    const newReviewRatingOption = document.createElement('option');
    newReviewRatingOption.setAttribute('value', i);
    i === 0 ? newReviewRatingOption.innerHTML = "... select" : newReviewRatingOption.innerHTML = (i === 1 ?  `${i} star out of 5!` :  `${i} stars out of 5!`);
    newReviewRating.appendChild(newReviewRatingOption);
  }

  const newReviewBtnWrap = document.createElement('div');
  newReviewBtnWrap.className = 'new-review-btn-wrap';
  const newReviewBtn = document.createElement('button');
  newReviewBtn.className = 'new-review-btn';
  newReviewBtn.innerHTML = 'Add a new review';
  newReviewBtn.addEventListener('click', function() {
    validateReviewForm();
  })
  newReviewBtnWrap.appendChild(newReviewBtn);

  const newReviewError = document.createElement('div');
  newReviewError.className = 'new-review-error';
  newReviewError.setAttribute('id', 'newReviewError');

  newReviewWrap.appendChild(title);
  newReviewWrap.appendChild(newReviewAuthorLabel);
  newReviewWrap.appendChild(newReviewAuthor);
  newReviewWrap.appendChild(newReviewTextLabel);
  newReviewWrap.appendChild(newReviewText);
  newReviewWrap.appendChild(newReviewRatingLabel);
  newReviewWrap.appendChild(newReviewRating);
  newReviewWrap.appendChild(newReviewBtnWrap);
  newReviewWrap.appendChild(newReviewError);

  container.appendChild(newReviewWrap);
}

validateReviewForm = () => {
  clearErrors();
  let errors = [];
  const author = document.getElementById('newReviewAuthor');
  const review = document.getElementById('newReviewText');
  const ratingElem = document.getElementById('newReviewRating');

  let name = "";
  if (author) {
    author.value.trim() === "" ? errors.push("Enter your name!") : name = author.value.trim();
  }
  
  let comments = "";
  if (review) {
    review.value.trim() === "" ? errors.push("Write something about this restaurant!") : comments = review.value.trim();
  }

  let rating = 0;
  if (ratingElem) {
    if (ratingElem.value === '0' || ratingElem.value === 0) {
      errors.push("Rate this restaurant!");
    } else {
      rating = ratingElem.value;
    }
  }
  const restaurant_id = getParameterByName('id');
  errors.length === 0 ? addReview({restaurant_id, name, rating, comments}) : showErrors(errors);
}

clearErrors = () => {
  const errorWrapper = document.getElementById('newReviewError');
  errorWrapper.innerHTML = "";
}

cleanReviewForm = () => {
  const author = document.getElementById('newReviewAuthor');
  author.value = "";
  const review = document.getElementById('newReviewText');
  review.value = "";
  const rating = document.getElementById('newReviewRating');
  rating.value = 0;
}

addReview = (review) => {
  DBHelper.addNewReview(review);
  cleanReviewForm();
}

showErrors  = (errors) => {
  const errorWrapper = document.getElementById('newReviewError');
  for (error of errors) {
    const p = document.createElement('p');
    const textNode = document.createTextNode(error);
    p.appendChild(textNode);
    errorWrapper.appendChild(p);
  }
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
