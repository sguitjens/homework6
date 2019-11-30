// let apiKey = 'd5063d29f50830106cfbe3f17f54053f'
// let cityCode = 524901;
// let cityCode1 = 703448;
// let cityCode2 = 2643743;
let cityLat = 0;
let cityLon = 0;
let cityName = ''; // for getting the city name from the response, if needed
let countryCode = '';
let tempInK = 0;
let currentTemp = 0;
let maxTemp = 0;
let minTemp = 0;
let humidity = 0;
let windSpeed = 0;
let windDir = '';
let uvIndex = 0;
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
// let cityQuery = 'group?id=524901';
// let cityQuery = 'group?'
let uviQuery = 'uvi?'
let apiKey = '&appid=d5063d29f50830106cfbe3f17f54053f'                  
//https://api.openweathermap.org/data/2.5/weather?q=group?id=524901&appid=d5063d29f50830106cfbe3f17f54053f
 
$('#city-search').click(() => {
  event.preventDefault();
  let citySearchString = validatedSearchString($('input').attr("placeholder", "City Name").val());
  // VALIDATE CITY NAME AND PARSE COUNTRY CODE, IF THERE IS ONE
  let cityQuery = 'weather?q=' + citySearchString;

  console.log('CITY QUERY', cityQuery);

  $.ajax({
    url: weatherInfoRequestPrefix + cityQuery + apiKey,
    method: "GET",
    error: (err => {
      console.log('ERROR WAS RETURNED', err);
      alert("Your city was not found. Check your spelling, or enter a city name with a country code, separated by a comma")
      return;
    })
  })
  .then(function(response) {
    console.log('RESPONSE', response);
    cityLat = response.coord.lat;
    cityLon = response.coord.lon;
    cityName = response.name;
    countryCode = response.sys.country;
    tempInK = response.main.temp;
    humidity = response.main.humidity;
    windSpeed = response.wind.speed;
    iconName = response.weather[0].icon;
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
      console.log('URL for FIVE-DAY', fiveDayRequestPrefix + citySearchString + '&mode=json' + apiKey),
      showValuesInConsoleLog()
      showValuesOnPage();
    })
  })
  $.ajax({
    url: fiveDayRequestPrefix + citySearchString + apiKey,
    method: "GET"
  })
  .then(response => {
    return setFiveDayData(response);
  })
})

let validatedSearchString = (city => {
  let search = city.split(',');
  if(search.length > 1){
    // make sure neither string is empty
    let first = search[0].length;
    let second = search[1].length;
    if(first === 0 || second === 0) {
      return first > second ? search[0] : search[1];
    }
    return search[0] + ',' + search[1];
  } else {
    return city;
  }
})

// function showValuesInConsoleLog() {
//   console.log('lat', cityLat);
//   console.log('lon', cityLon);
//   console.log('temp (in Kelvin)', tempInK);
//   console.log('temp in Celcius', tempInK - 273.15);
//   console.log('humidity', humidity);
//   console.log('wind speed', windSpeed);
//   console.log('uv index', uvIndex);
// }

function showValuesOnPage() {
  // TODO: check how this is being done with the icon
  console.log('ICON URL', iconURL + iconName + '.png')
  $('#city-name').text(cityName + ', ' + countryCode);
  $('#weather-icon').attr('src', iconURL + iconName + '.png')
  $('#temp-data').text('Temperature: ' + 
    (tempInK - 273.15).toFixed(2) + ' ' + String.fromCharCode(176) + 'C (' +
    ((tempInK - 273.15) * 9/5 + 32).toFixed(2) + ' ' + String.fromCharCode(176) + 'F)');
  $('#hum-data').text('Humidity: ' + humidity + '%');
  $('#wind-data').text('Wind Speed: ' + windSpeed + ' MPH');
  $('#uvi-data').text('UV Index: ' + uvIndex);
}

function initializeLocalStorage() {
  localStorage.setItem('weatherSearches', '{}');
};

let setFiveDayData = (response => {
  let dataArray = response.list;
  let size = dataArray.length;
  // TODO:
  // set the first one as zero
  // then go through the rest starting at wherever noon is
  let dayNumber = 1;
  for(let i = 0; i < size; i+=8) {
    console.log("LOOP");
    $(`#five-day-${dayNumber}`).find('h6').text(dataArray[i].dt);
    $(`#five-day-${dayNumber}`).find('.weather-icon').attr('src', iconURL + dataArray[i].weather[0].icon + '.png');
    $(`#five-day-${dayNumber}`).find('.temp-5').text('Temperature: ' + 
      (dataArray[i].main.temp - 273.15).toFixed(2) + ' ' + String.fromCharCode(176) + 'C (' +
      ((dataArray[i].main.temp - 273.15) * 9/5 + 32).toFixed(2) + ' ' + String.fromCharCode(176) + 'F)');
    $(`#five-day-${dayNumber}`).find('.hum-5').text('Humidity: ' + dataArray[i].main.humidity + '%');
    ++ dayNumber;
  }
})

/* LOCAL STORAE FUNCTIONS */

function saveToLocalStorage(searchesObj) {
  localStorage.setItem('workDay', JSON.stringify(dayObj));
}

function addToSearchHistory(hourString, val) {
  if(!localStorage.getItem('workDay')) {
    initializeLocalStorage();
  }

  let workHours = JSON.parse(localStorage.getItem('workDay'));
  workHours[hourString] = val

  saveToLocalStorage(workHours);
}

/* END OF LOCAL STORAGE FUNCTIONS */

let searchHistory = {
  'Portland': 1575071887,
  'London, UK': 1575072014,
  'Moscow, RU': 1575075000
}

let sortByLastSearch = (obj => {
  return Object.entries(obj).sort((a, b) => {
    a[1] > b[1] ? -1 : 1;
  })
})

