function main() {
  // Get the location then fetch the JSON
  navigator.geolocation.getCurrentPosition(function(position) {

    var url = "http://forecast.weather.gov/MapClick.php?";
    url += "&rand=" + (new Date()).getTime();
    url += "&lat=" + position.coords.latitude;
    url += "&lon=" + position.coords.longitude;
    url += "&FcstType=json";
    url += "&_=" + (new Date()).getTime();

    fetch(url).then(function(response) {
      return response.json();
    }).then(function(jsonResponse) {

      // Create the observation
      var observation = {
        windDir: getCardinal(jsonResponse.currentobservation.Windd),
        currentTemp: jsonResponse.currentobservation.Temp,
        conditions: jsonResponse.currentobservation.Weather,
        relHuimidity: jsonResponse.currentobservation.Relh,
        windSpeed: jsonResponse.currentobservation.Winds,
        windGust: jsonResponse.currentobservation.Gust,
        pressureMb: jsonResponse.currentobservation.Altimeter,
        dewPoint: jsonResponse.currentobservation.Dewp,
        windChill: jsonResponse.currentobservation.WindChill,
        visibility: jsonResponse.currentobservation.Visibility,
        locationName: jsonResponse.location.areaDescription
      }

      // Map the data to forecast days (too hard to do in the template)
      var forecasts = mapForecasts(jsonResponse);

      // Render and show the template
      showWeather(observation, forecasts);

    })
    .catch(function(error) {
      showError("An error occurred");
    });

  }, function(error) {
    showError("Unable to get current location");
  });
}

function showError(message) {
  document.querySelector("body").innerHTML = message;
}

function showWeather(observation, forecasts) {
  var template = document.getElementById("template").innerHTML;
  var rendered = Mustache.render(template, {observation: observation, days: forecasts});
  document.querySelector("body").innerHTML = rendered;
}

function mapForecasts(jsonResponse) {
  var numberOfDays = jsonResponse.time.startPeriodName.length;
  var forecastDays = [];
  for (var index=0; index<numberOfDays; index++) {
    forecastDays.push({
      period: jsonResponse.time.startPeriodName[index],
      weather: jsonResponse.data.weather[index],
      tempLabel: jsonResponse.time.tempLabel[index],
      temp: jsonResponse.data.temperature[index],
      text: jsonResponse.data.text[index]
    });
  }
  return forecastDays;
}

function getCardinal(angle) {
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