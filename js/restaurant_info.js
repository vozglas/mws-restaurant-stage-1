
let restaurant;
var map;

registerSW();

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
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
  // try to execute all failed requests when we were offline!
  DBHelper.executeFailedRequests();


  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  
  const favorite = document.createElement('div');

  if (restaurant.is_favorite) {
    name.innerHTML += `<span>★</span>`;
    name.appendChild(favorite);
    const btnFavorite = document.createElement('button');
    btnFavorite.className = 'btn-remove-favorite';
    btnFavorite.innerText = 'Remove this restaurant from favorites!';
    btnFavorite.addEventListener('click', function() {
      DBHelper.favoriteRestaurant(restaurant, false).then(response => {
        fillRestaurantHTML();
      });
    });
    favorite.appendChild(btnFavorite);
  } else {
    name.appendChild(favorite);
    const btnUnFavorite = document.createElement('button');
    btnUnFavorite.className = 'btn-add-favorite';
    btnUnFavorite.innerText = 'Add this restaurant to favorites!';
    btnUnFavorite.addEventListener('click', function() {
      DBHelper.favoriteRestaurant(restaurant, true).then(response => {
        fillRestaurantHTML();
      });
    });
    favorite.appendChild(btnUnFavorite);
  }
  

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const picture = document.getElementById('restaurant-picture');
  picture.innerHTML = "";

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
  // first get reviews from IDB
  DBHelper.fetchReviewsByRestaurantId(restaurant.id).then(reviews => {
    fillReviewsHTML(reviews).then(response => {
      // check if there are new reviews, add them to IDB and refresh the reviews container
      return DBHelper.updateReviewsDB(reviews, restaurant.id).then(update => {
        if (update === true) DBHelper.fetchReviewsByRestaurantId(restaurant.id).then(reviews => {
          fillReviewsHTML(reviews);
        })
      })
    })
  })


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
  hours.innerHTML = '';
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
fillReviewsHTML = (reviews) => {
  resetReviews();

  const container = document.getElementById('reviews-container');
  const title = document.getElementById('reviewsTitle');

  if (reviews) {
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
      restaurantId = review.restaurantId;
    });
    container.appendChild(ul);
  } else {
    const noReviews = document.createElement('p');
    noReviews.className = "no-review";
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
  }
  addReviewForm();
  return Promise.resolve();
}

// clear reviews container
resetReviews = (reviews) => {
  // Remove all reviews
  const ul = document.getElementById('reviews-list');
  ul.innerHTML = '';
  // remove new review form
  const newReviewWrap = document.getElementById('new-review-wrap');
  newReviewWrap.innerHTML = '';
}

// add review form
addReviewForm = () => {
  const container = document.getElementById('reviews-container');

  const title = document.createElement('h4');
  title.innerHTML = 'Write a review';

  const newReviewWrap = document.getElementById('new-review-wrap');
  newReviewWrap.className = 'new-review-wrap';

  const newReviewAuthor = document.createElement('input');
  newReviewAuthor.setAttribute('id', 'newReviewAuthor');
  newReviewAuthor.className = 'new-review-author';
  const newReviewAuthorLabel = document.createElement('label');
  newReviewAuthorLabel.htmlFor = 'newReviewAuthor';
  newReviewAuthorLabel.innerHTML = 'Enter your name: ';
  newReviewAuthorLabel.className = 'new-review-labels';
  

  const newReviewText = document.createElement('textarea');
  newReviewText.className = 'new-review-text';
  newReviewText.setAttribute('id', 'newReviewText');
  newReviewText.rows = 5;
  const newReviewTextLabel = document.createElement('label');
  newReviewTextLabel.htmlFor = 'newReviewText';
  newReviewTextLabel.innerHTML = 'Write a review: ';
  newReviewTextLabel.className = 'new-review-labels';
  
  const newReviewRating = document.createElement('select');
  newReviewRating.className = 'new-review-rating';
  newReviewRating.setAttribute('id', 'newReviewRating');
  const newReviewRatingLabel = document.createElement('label');
  newReviewRatingLabel.htmlFor = 'newReviewRating';
  newReviewRatingLabel.innerHTML = 'Restaurant rating: ';
  newReviewRatingLabel.className = 'new-review-labels';
  for (let i = 0; i < 6; i++) {
    const newReviewRatingOption = document.createElement('option');
    newReviewRatingOption.setAttribute('value', i);
    i === 0 ? newReviewRatingOption.innerHTML = "..." : newReviewRatingOption.innerHTML = (i === 1 ?  `${i} star out of 5!` :  `${i} stars out of 5!`);
    newReviewRating.appendChild(newReviewRatingOption);
  }

  const newReviewBtnWrap = document.createElement('div');
  newReviewBtnWrap.className = 'new-review-btn-wrap';
  const newReviewBtn = document.createElement('button');
  newReviewBtn.className = 'new-review-btn';
  newReviewBtn.innerHTML = 'Add a new review';
  newReviewBtn.addEventListener('click', function() {
    review = {};
    review.restaurant_id = parseInt(getParameterByName('id'));
    review.name = newReviewAuthor.value;
    review.createdAt = new Date().getTime();
    review.updatedAt = new Date().getTime();
    review.comments = newReviewText.value;
    review.rating = newReviewRating.value;

    validateReviewForm(review, "newReview", "newReviewError");
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
  
  const formatedDate = formatDate(new Date(review.createdAt));
  date.innerHTML = formatedDate;

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

  const comments = document.createElement('p');
  comments.className = 'review-comments';
  comments.innerHTML = review.comments;

  const headAll = document.createElement('div');
  headAll.setAttribute('id', `review-headAll-${review.id}`);
  headAll.appendChild(rating);
  headAll.appendChild(comments);
  li.appendChild(headAll);

  const btnDelete = document.createElement('button');
  btnDelete.className = 'review-btn-delete';
  btnDelete.innerHTML = `delete`;
  btnDelete.addEventListener('click', function() {
    makeDeleteReviewDlg(review.id);
    openModalDeleteReview(document.activeElement);
  })

  const btnEdit = document.createElement('button');
  btnEdit.className = 'review-btn-edit';
  btnEdit.innerHTML = `edit`;
  btnEdit.addEventListener('click', function() {
    document.getElementById(`review-headAll-${review.id}`).style.display = 'none';
    document.getElementById(`review-footer-container-${review.id}`).style.display = 'none';
    document.getElementById(`edit-review-${review.id}`).style.display = 'block';
    fillEditForm(review);
    document.getElementById( `cancel-review-btn-${review.id}`).focus();
  })

  const reviewBtnWrap = document.createElement('div');
  reviewBtnWrap.className = 'review-btn-wrap';
  reviewBtnWrap.appendChild(btnDelete);
  reviewBtnWrap.appendChild(btnEdit);

  const footer = document.createElement('p');
  footer.className = 'review-footer-container';
  footer.setAttribute('id', `review-footer-container-${review.id}`)
  footer.appendChild(reviewBtnWrap);
  
  li.appendChild(footer);
  li.appendChild(makeEditForm(review, btnEdit));
  return li;
}

fillEditForm = (review) => {
  document.getElementById(`editReviewRating-${review.id}`).value = review.rating;
  document.getElementById(`editReviewText-${review.id}`).value = review.comments;
}

makeEditForm = (review, lastFocusedElem) => {

  const editReviewWrap = document.createElement('div');
  editReviewWrap.className = 'edit-review-wrap';
  editReviewWrap.setAttribute('id', `edit-review-${review.id}`);

  const editReviewText = document.createElement('textarea');
  editReviewText.className = 'new-review-text';
  editReviewText.setAttribute('id', `editReviewText-${review.id}`);
  editReviewText.rows = 5;
  const editReviewTextLabel = document.createElement('label');
  editReviewTextLabel.htmlFor = 'editReviewText';
  editReviewTextLabel.innerHTML = 'Review: ';
  editReviewTextLabel.className = 'new-review-labels';
  
  const editReviewRating = document.createElement('select');
  editReviewRating.className = 'new-review-rating';
  editReviewRating.setAttribute('id', `editReviewRating-${review.id}`);
  
  const editReviewRatingLabel = document.createElement('label');
  editReviewRatingLabel.htmlFor = 'editReviewRating';
  editReviewRatingLabel.innerHTML = 'Restaurant rating: ';
  editReviewRatingLabel.className = 'new-review-labels';
  for (let i = 0; i < 6; i++) {
    const editReviewRatingOption = document.createElement('option');
    editReviewRatingOption.setAttribute('value', i);
    i === 0 ? editReviewRatingOption.innerHTML = "..." : editReviewRatingOption.innerHTML = (i === 1 ?  `${i} star out of 5!` :  `${i} stars out of 5!`);
    editReviewRating.appendChild(editReviewRatingOption);
  }

  const editReviewBtnWrap = document.createElement('div');
  editReviewBtnWrap.className = 'new-review-btn-wrap';
  const editReviewBtn = document.createElement('button');
  editReviewBtn.className = 'new-review-btn';
  editReviewBtn.innerHTML = 'Save review';
  editReviewBtn.addEventListener('click', function() {
    review.rating = editReviewRating.value;
    review.comments = editReviewText.value;
    review.updatedAt = new Date().getTime();
    // CLICK !!!
    // validate from + update review
    validateReviewForm(review, "updateReview", `editReviewError-${review.id}`);
    // close edit form
    document.getElementById(`review-footer-container-${review.id}`).style.display = 'block';
    document.getElementById(`review-headAll-${review.id}`).style.display = 'block';
    editReviewWrap.style.display = 'none';
  });
  const editCancelReviewBtn = document.createElement('button');
  editCancelReviewBtn.className = 'cancel-review-btn';
  editCancelReviewBtn.setAttribute('id', `cancel-review-btn-${review.id}`) ;
  editCancelReviewBtn.innerHTML = 'Cancel';
  editCancelReviewBtn.addEventListener('click', function() {
    // CLICK !!!
    document.getElementById(`review-footer-container-${review.id}`).style.display = 'block';
    document.getElementById(`review-headAll-${review.id}`).style.display = 'block';
    editReviewWrap.style.display = 'none';
    // set focus to last focused element
    lastFocusedElem.focus();
  });
  
  editReviewBtnWrap.appendChild(editReviewBtn);
  editReviewBtnWrap.appendChild(editCancelReviewBtn)

  const editReviewError = document.createElement('div');
  editReviewError.className = 'new-review-error';
  editReviewError.setAttribute('id', `editReviewError-${review.id}`);

  editReviewWrap.appendChild(editReviewRatingLabel);
  editReviewWrap.appendChild(editReviewRating);
  editReviewWrap.appendChild(editReviewTextLabel);
  editReviewWrap.appendChild(editReviewText);
  editReviewWrap.appendChild(editReviewBtnWrap);
  editReviewWrap.appendChild(editReviewError);

  return editReviewWrap;
}

validateReviewForm = (review = {}, actionAfter = '', errorContainer = '') => {
  clearErrors(errorContainer);
  let errors = [];

  review.name.trim() === "" ? errors.push("Enter your name!") : review.name.trim();
  review.comments.trim() === "" ? errors.push("Write something about this restaurant!") : review.comments.trim();
  (review.rating === '0' || review.rating === 0) ? errors.push("Rate this restaurant!") : parseInt(review.rating);

  if (errors.length === 0) {
    switch(actionAfter) {
      case "newReview": 
        addReview(review);
        break;
      case "updateReview":
        updateReview(review);
        break;
    }
  } else {
    showErrors(errors, errorContainer);
  }
}

clearErrors = (errorContainer) => {
  const errorWrapper = document.getElementById(errorContainer);
  errorWrapper.innerHTML = "";
}


addReview = (review) => {
  DBHelper.addNewReviewDB(review);
  cleanReviewForm(document.getElementById('newReviewAuthor'), document.getElementById('newReviewText'), document.getElementById('newReviewRating'));
  refreshReviews(review.restaurant_id);
}

deleteReview = (reviewId) => {
  DBHelper.deleteReviewDB(reviewId);
  const restaurantId = parseInt(getParameterByName('id'));
  refreshReviews(restaurantId);
}

updateReview = (review) => {
  DBHelper.updateReview(review);
  refreshReviews(review.restaurant_id);
}

refreshReviews = (restaurantId) => {
  DBHelper.fetchReviewsByRestaurantId(restaurantId).then(reviews => {
    fillReviewsHTML(reviews);
  })
}

cleanReviewForm = (authorElem, commentsElem, ratingElem) => {
  authorElem.value = "";
  commentsElem.value = "";
  ratingElem.value = 0;
}

showErrors  = (errors, errorContainer) => {
  const errorWrapper = document.getElementById(errorContainer);
  for (error of errors) {
    const p = document.createElement('p');
    const textNode = document.createTextNode(error);
    p.appendChild(textNode);
    errorWrapper.appendChild(p);
  }
}

/* create modal dialog */
makeDeleteReviewDlg = (objId) => {
  const modal = document.getElementById('dlgModalDeleteReview');
  modal.innerHTML = "";
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  const hidObjId = document.createElement('input');
  hidObjId.setAttribute("type", "hidden");
  hidObjId.setAttribute("id", "hidObjId");
  hidObjId.value = objId;
  const modalContentText = document.createElement('div');
  modalContentText.className = 'modal-upper-text';
  modalContentText.innerHTML = `Delete the review? Are you sure?`;
  const btnNo = document.createElement('button');
  btnNo.className = 'modal-button-cancel';
  btnNo.innerHTML = `No!`;
  const btnDelete = document.createElement('button');
  btnDelete.className = 'modal-button-danger';
  btnDelete.innerHTML = `Yes`;

  modalContent.appendChild(hidObjId);
  modalContent.appendChild(modalContentText);
  modalContent.appendChild(btnDelete);
  modalContent.appendChild(btnNo);

  modal.appendChild(modalContent);
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

formatDate = (date) => {
  const monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  return `${monthNames[monthIndex]} - ${day} - ${year}`;
}