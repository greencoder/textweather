// Calls the NOAA API for the given lat, long
function fetchNoaa(currentLocation, callbackSuccess, callbackError) {

  // Construct the URL
  var url = "https://forecast.weather.gov/MapClick.php?";
  url += "&rand=" + (new Date()).getTime();
  url += "&lat=" + currentLocation.lat;
  url += "&lon=" + currentLocation.lng;
  url += "&FcstType=json";
  url += "&_=" + (new Date()).getTime();

  // Note: I'd prefer to use fetch(), but old versions of Mobile Safari don't support it
  var xhr = new XMLHttpRequest();

  // Timeout after 15 seconds
  xhr.timeout = 15 * 1000;

  // When we get the response back
  xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      try {
        var jsonResponse = JSON.parse(xhr.responseText);
        // Make sure we didnt' get a 200 response with a failure message
        if (jsonResponse.hasOwnProperty("success") && jsonResponse.success === false) {
          callbackError("Bad response returned from NWS.");
          return;
        }
        else {
          callbackSuccess(jsonResponse);
          return;
        }
      }
      catch(e) {
        callbackError("Bad response returned from NWS.");
        return;
      }
    }
  }

  // If the request errors
  xhr.onerror = function(error) {
    callbackError("An error occurred. NWS servers might be down.");
    return;
  }

  // If the request times out
  xhr.ontimeout = function(error) {
    callbackError("Could not reach NWS servers.");
    return;
  }

  // Send the request off
  xhr.open("GET", url, true);
  xhr.send();

}

// Parses the NOAA API JSON, renders the output template, then puts it in the DOM
function renderWeather(jsonResponse) {
  var observation = createObservation(jsonResponse);
  var forecasts = createForecasts(jsonResponse);
  var template = document.getElementById("template").innerHTML;
  var rendered = Mustache.render(template, {observation: observation, days: forecasts});
  document.querySelector("main").innerHTML = rendered;
}

// Uses the Geolocation API to get current location
function queryLocation(callbackSuccess, callbackError) {
  navigator.geolocation.getCurrentPosition(function(position) {
    // Make sure we got a good response back
    if (position.coords && position.coords.latitude && position.coords.longitude) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      callbackSuccess({ lat: lat, lng: lng });
    }
    else {
      callbackError("Could not get current location");
    }
  }, function(error) {
    callbackError("Unable to get your current location.");
  });
}

// Put an error message into the <main> tag with a "try again" link
function showError(message) {
  var errorMessage = message + "<br/><br/><a href=\"javascript:window.location.reload(true)\">Try again</a>";
  document.querySelector("main").innerHTML = errorMessage;
}

// Put a string message into the <main> tag
function showMessage(message) {
  document.querySelector("main").innerHTML = message;
}

// Checks to see if the value is "NA", which happens often
function valueOrUnknown(value, suffix) {
  if (value === "NA" || !value) {
    return "Unknown";
  }
  if (suffix) {
    return value + suffix;
  }
  return value;
}

// Creates an observation object from the API response
function createObservation(jsonResponse) {
  var observation = {
    currentTemp: valueOrUnknown(jsonResponse.currentobservation.Temp, "&deg;F"),
    relHumidity: valueOrUnknown(jsonResponse.currentobservation.Relh, "%"),
    windSpeed: valueOrUnknown(jsonResponse.currentobservation.Winds),
    dewPoint: valueOrUnknown(jsonResponse.currentobservation.Dewp, "&deg;F"),
    locationName: valueOrUnknown(jsonResponse.location.areaDescription),
    windGust: valueOrUnknown(jsonResponse.currentobservation.Gust, "mph"),
    windDir: valueOrUnknown(jsonResponse.currentobservation.Windd),
    pressure: valueOrUnknown(jsonResponse.currentobservation.Altimeter, "mb"),
    conditions: valueOrUnknown(jsonResponse.currentobservation.Weather),
    windChill: valueOrUnknown(jsonResponse.currentobservation.WindChill, "&deg;F"),
    visibility: valueOrUnknown(jsonResponse.currentobservation.Visibility, " miles")
  }

  // Create the wind speed and direction as a string
  if (observation.windDir !== "Unknown" && observation.windSpeed !== "Unknown") {
    var direction = getCardinalDirection(observation)
    observation.windSpeedDir = direction + " @ " + observation.windSpeed + "mph";
  }
  else {
    observation.windSpeedDir = "Unknown";
  }

  return observation;
}

// Take the data arrays and combine them into a forecast object for each day
function createForecasts(jsonResponse) {
  var numberOfDays = jsonResponse.time.startPeriodName.length;
  var forecasts = [];
  for (var index=0; index<numberOfDays; index++) {
    forecasts.push({
      period: jsonResponse.time.startPeriodName[index],
      weather: jsonResponse.data.weather[index],
      tempLabel: jsonResponse.time.tempLabel[index],
      temp: jsonResponse.data.temperature[index],
      text: jsonResponse.data.text[index]
    });
  }
  return forecasts;
}

// Take a compass direction (0-360) and return the cardinal direction (N, S, E, W, etc.)
function getCardinalDirection(angle) {
  var angle = parseInt(angle);
  var directions = 8;
  var degree = 360 / directions;
  angle = angle + degree/2;
  if (angle >= 0 * degree && angle < 1 * degree)
      return "N";
  if (angle >= 1 * degree && angle < 2 * degree)
      return "NE";
  if (angle >= 2 * degree && angle < 3 * degree)
      return "E";
  if (angle >= 3 * degree && angle < 4 * degree)
      return "SE";
  if (angle >= 4 * degree && angle < 5 * degree)
      return "S";
  if (angle >= 5 * degree && angle < 6 * degree)
      return "SW";
  if (angle >= 6 * degree && angle < 7 * degree)
      return "W";
  if (angle >= 7 * degree && angle < 8 * degree)
      return "NW";
  return "N";
}

// Runs when we start
showMessage("Finding your current location...");

// Get the user's current location
queryLocation(function(currentLocation) {

  // Call the API and show the results
  showMessage("Retrieving current weather from NOAA...");

  // Once we have the location, we can call NOAA
  fetchNoaa(currentLocation, function(response) {
    renderWeather(response);
  }, function(error) {
    showError("Could not fetch weather from NOAA.");
  }); // fetchNoaa

  // If there was a problem getting the location
  }, function(error) {
    showError("Could not get your current location.");
  }

); // queryLocation
