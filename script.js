// let apiKey = 'd5063d29f50830106cfbe3f17f54053f'
let cityCode = 524901;
let cityCode1 = 703448;
let cityCode2 = 2643743;
let cityLat = 0;
let cityLon = 0;
let cityName = ''; // for getting the city name from the response, if needed
let tempInK = 0;
let date = 'date today: TBD'; // TODO: 
let city = 'london';
let country = ',us'
let currentTemp = '';
let maxTemp = '';
let minTemp = '';
let humidity = '';
let windSpeed = '';
let windDir = '';
let uvIndex = '';
let iconName = ''
let iconURL= 'https://openweathermap.org/img/wn/';
let weatherIcon = '';


//https://api.openweathermap.org/data/2.5/group?id=524901,703448,2643743&units=metric
//https://api.openweathermap.org/data/2.5/find?lat=55.5&lon=37.5&cnt=10
//https://api.openweathermap.org/data/2.5/uvi?lat=37.75&lon=-122.37
// 5-day
//https://api.openweathermap.org/data/2.5/weather?q=London
//https://api.openweathermap.org/data/2.5/forecast?q=London,us&mode=json // this is the correct one

let weatherInfoRequestPrefix = 'http://api.openweathermap.org/data/2.5/';
let fiveDayRequestPrefix = 'https://api.openweathermap.org/data/2.5/forecast?q='; // + &mode=json
let cityQuery = 'group?id=524901';
let uviQuery = 'uvi?'
let apiKey = '&appid=d5063d29f50830106cfbe3f17f54053f'                  
//https://api.openweathermap.org/data/2.5/weather?q=group?id=524901&appid=d5063d29f50830106cfbe3f17f54053f
 

$.ajax({
  url: weatherInfoRequestPrefix + cityQuery + apiKey,
  method: "GET"
})
.then(function(response) {
  console.log('RESPONSE', response);
  cityLat = response.list[0].coord.lat;
  cityLon = response.list[0].coord.lon;
  tempInK = response.list[0].main.temp;
  humidity = response.list[0].main.humidity;
  windSpeed = response.list[0].wind.speed;
  iconName = response.list[0].weather[0].icon;
  console.log('lat, lon', cityLat + "' " + cityLon);
})
.then(() => {
  return $.ajax({
    url: weatherInfoRequestPrefix + uviQuery + apiKey + '&lat=' + cityLat + '&lon=' + cityLon,
    method: "GET"
  })
  .then(response => {
    console.log('RESPONSE2', response);
    uvIndex = response.value;
  })
  .then(() => {
    console.log('URL for FIVE-DAY', fiveDayRequestPrefix + city + country + '&mode=json' + apiKey),
    showValuesInConsoleLog()
    showValuesOnPage();
  })
})
$.ajax({
  url: fiveDayRequestPrefix + city + apiKey,
  method: "GET"
})
.then(response => {
  console.log('RESPONSE3', response);
})

function showValuesInConsoleLog() {
  console.log('lat', cityLat);
  console.log('lon', cityLon);
  console.log('temp (in Kelvin)', tempInK);
  console.log('temp in Celcius', tempInK - 273.15);
  console.log('humidity', humidity);
  console.log('wind speed', windSpeed);
  console.log('uv index', uvIndex);
  console.log('weather icon url', (iconURL + iconName + '@2x.png'));
}




function showValuesOnPage() {
  // $('#weather-icon').attr('src', iconURL + iconName + '@2x.png');
  $('#weather-icon').attr('src', iconURL + iconName + '.png');
  $('#forecast').append('<div>Latitude: ' + cityLat + '</div>');
  // $('#forecast').append('<div>Longitude: ' + cityLon + '<\div>');
  // $('#forecast').append('<div>Temperature (K): ' + tempInK + '<\div>');
  $('#forecast').append('<div>Temperature (C): ' + (tempInK - 273.15).toFixed(2) + ' &deg C<\div>');
  $('#forecast').append('<div>Wind Speed: ' + windSpeed + ' MPH</div>');
  $('#forecast').append('<div>UV Index: ' + uvIndex + '</div>');
}
