# Mobile Web Specialist Certification Course
---
This is the project that I've build during the Udacity Mobile Web Specialist Certification Course.
It's performant, accessible and mobile ready web application. Can work online and offline.

To test this app you need:
1. Write your Google API key in js/main.js in loadMap() function
```
loadMap = () => {
  ...
  googleMapsScript.setAttribute('src', 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=map_callback');
  ...
}
```
2. Run a Node development server, which you can find here https://github.com/vozglas/mws-restaurant-stage-3
(Also there is a README file with insructions for getting the server up and running locally on your computer).


