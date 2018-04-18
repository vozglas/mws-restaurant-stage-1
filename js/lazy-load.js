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

