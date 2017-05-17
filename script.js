function main() {

  // Get the location then fetch the JSON
  showMessage("Looking up your current location...");

  navigator.geolocation.getCurrentPosition(function(position) {

    // Make sure we got a good response back
    if (position.coords && position.coords.latitude && position.coords.longitude) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      showMessage("Retrieving weather for your location...");
    }
    else {
      showMessage("Could not get current location");
      return;
    }

    // Fetch the NOAA JSON API
    var url = "https://forecast.weather.gov/MapClick.php?";
    url += "&rand=" + (new Date()).getTime();
    url += "&lat=" + lat;
    url += "&lon=" + lng;
    url += "&FcstType=json";
    url += "&_=" + (new Date()).getTime();

    fetch(url).then(function(response) {
      return response.json();
    }).then(function(jsonResponse) {

      // Create the observation
      var observation = {
        currentTemp: jsonResponse.currentobservation.Temp,
        relHumidity: jsonResponse.currentobservation.Relh,
        windSpeed: jsonResponse.currentobservation.Winds,
        dewPoint: jsonResponse.currentobservation.Dewp,
        locationName: jsonResponse.location.areaDescription
      }

      // The wind gust might be "NA"
      if (jsonResponse.currentobservation.Gust === "NA") {
        observation.windGust = "None";
      }
      else {
        observation.windGust = jsonResponse.currentobservation.Gust + " mph";
      }

      // Sometimes the wind direction is "NA"
      if (jsonResponse.currentobservation.Windd === "NA") {
        observation.windDir = "";
      }
      else {
        observation.windDir = getCardinalDirection(jsonResponse.currentobservation.Windd);
      }

      // The pressure might be "NA"
      if (jsonResponse.currentobservation.Altimeter === "NA") {
        observation.pressureMb = "Unknown";
      }
      else {
        observation.pressureMb = jsonResponse.currentobservation.Altimeter + " mb";
      }

      // The conditions might be "NA"
      if (jsonResponse.currentobservation.Weather === "NA") {
        observation.conditions = "Unknown";
      }
      else {
        observation.conditions = jsonResponse.currentobservation.Weather;
      }

      // The wind chill might be "NA"
      if (jsonResponse.currentobservation.WindChill === "NA") {
        observation.windChill = jsonResponse.currentobservation.Temp;
      }
      else {
        observation.windChill = jsonResponse.currentobservation.WindChill;
      }

      // The visibility might be "NA"
      if (jsonResponse.currentobservation.Visibility === "NA") {
        observation.visibility = "Unknown";
      }
      else {
        observation.visibility = jsonResponse.currentobservation.Visibility + " miles";
      }

      // Map the data to forecast days (too hard to do in the template)
      var forecasts = createForecasts(jsonResponse);

      // Render and show the template
      showWeather(observation, forecasts);

    })
    .catch(function(error) {
      showMessage("An error occurred. NWS might be down.");
    });

  }, function(error) {
    showMessage("Unable to get your current location");
  });
}

// Put a string message into the <main> tag
function showMessage(message) {
  document.querySelector("main").innerHTML = message;
}

// Render the weather template and put the result in the <main> tag
function showWeather(observation, forecasts) {
  var template = document.getElementById("template").innerHTML;
  var rendered = Mustache.render(template, {observation: observation, days: forecasts});
  document.querySelector("main").innerHTML = rendered;
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

// Run main when we load this script
main();
