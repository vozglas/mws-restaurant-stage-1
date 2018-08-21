# Mobile Web Specialist Certification Course
---
This is the project that I've build during the Udacity Mobile Web Specialist Certification Course.
It's performant, accessible and mobile ready web application. Can work online and offline.

To test this app you need:
1. Run a Node development server, which you can find here https://github.com/vozglas/mws-restaurant-stage-3
(Also there is a README file with insructions for getting the server up and running locally on your computer).

2. Write your Google API key in js/main.js in loadMap() function
```JavaScript
loadMap = () => {
  ...
  googleMapsScript.setAttribute('src', 'https://maps.googleapis.com/maps/api/js?key=`**YOUR_API_KEY**`&libraries=places&callback=map_callback');
  ...
}
```
How to get your Google API key: https://developers.google.com/maps/documentation/javascript/get-api-key

3. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

Or you can use Web Server for Chrome https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb 

4. With your server running, visit the site: `http://localhost:8000`




