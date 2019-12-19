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
let weatherInfoRequestPrefix = 'https://api.openweathermap.org/data/2.5/';
let fiveDayRequestPrefix = 'https://api.openweathermap.org/data/2.5/forecast?q='; // + &mode=json
let uviQuery = 'uvi?'
let apiKey = '&appid=d5063d29f50830106cfbe3f17f54053f'
let searchHistory = {};

$(document).ready(() => {
  console.log("DOCUMENT READY")
  updateSearchHistory();
})

// TODO: fix sort order
// TODO: fix truncation of array
// TODO: add config.js to protect api key

// gets the search history from local storage and displays its contents
// initializes it if it doesn't exist
// creates an array of items and calls the function to display them
let updateSearchHistory = (() => {
  // localStorage.clear();
  const searchHistoryObject = JSON.parse(localStorage.getItem('searchHistory'));
  console.log("searchHistoryObject", searchHistoryObject);
  if(searchHistoryObject === null) {
    initializeLocalStorage();
  } else {
    console.log("SEARCH HISTORY OBJECT", searchHistoryObject);
    const searchHistoryArray = [];

    for (let [key, value] of Object.entries(searchHistoryObject)) {
      // console.log([`${key}`, `${value}`]);
      searchHistoryArray.push([`${key}`, `${value}`]); 
    }
    console.log("SEARCH HISTORY ARRAY", searchHistoryArray);
    if(searchHistoryArray) {
      displaySearchHistory(searchHistoryArray);
      console.log("DISPLAYING SEARCH HISTORY");
    }
  }
})

// display the last ten searches: I think this might be where there are problems
let displaySearchHistory = (searchArray => {
  let index = 0;
  console.log("ARRAY FOREACH ISSUE", searchArray);
  // SORT HERE
  searchArray.sort((a, b) => {
    // console.log("a", a);
    // console.log("b", b);
    return a[1] + b[1];
  })

  let arrayLength = searchArray.length;
  // TRUNCATE HERE
  // if(arrayLength > 10) {
    let result = ''
  while(arrayLength > 10) {
    console.log("ARRAY BEFORE POP", searchArray);
    result = searchArray.pop();
    console.log("POPPED", result);
    console.log("ARRAY AFTER POP", searchArray);
    arrayLength = searchArray.length;
  }

  //update in local storage?????????????????????
  // clear local storage and put this item in instead
  localStorage.clear();
  let obj = Object.fromEntries(searchArray);
  console.log("::::::::OBJECT NOW::::::::", obj);
  localStorage.setItem(searchHistory, obj);

 

  // display
  for(let i = 0; i < arrayLength; ++i) {
    $(`#row${i}`).html(`<td><button class="recent${i} btn btn-link p-0 text-muted">${searchArray[i][0]}</button></td>`);
    $( "table" ).on( "click", "button", function( event ) {
      event.preventDefault();
      getWeatherInformation($(this).text());
      console.log("INDEX", index);
    })
  }
})

// this is called twice
let initializeLocalStorage = (() => {
  localStorage.setItem('searchHistory', '{}');
  console.log('LOCAL STORAGE', localStorage.getItem(searchHistory));
});

$('#city-search').click(() => {
  event.preventDefault();
  let citySearchString = validatedSearchString($('input').attr("placeholder", "City Name").val());
  getWeatherInformation(citySearchString);
  addToSearchHistory(citySearchString, Date.now());
})

$('input').keypress(event => {
  if (event.which == 13) {
    event.preventDefault();
    let citySearchString = validatedSearchString($('input').attr("placeholder", "City Name").val());
    getWeatherInformation(citySearchString);
    addToSearchHistory(citySearchString, Date.now());
  }
})

let getWeatherInformation = (citySearchString => {
  let cityQuery = 'weather?q=' + citySearchString;
  $.ajax({
    url: weatherInfoRequestPrefix + cityQuery + apiKey,
    method: "GET",
    error: (err => {
      alert("Your city was not found. Check your spelling, or enter a city name with a country code, separated by a comma")
      return;
    })
  })
  .then((response) => {
    cityLat = response.coord.lat;
    cityLon = response.coord.lon;
    cityName = response.name;
    countryCode = response.sys.country;
    tempInK = response.main.temp;
    humidity = response.main.humidity;
    windSpeed = response.wind.speed;
    iconName = response.weather[0].icon;
  })
  .then(() => {
    return $.ajax({
      url: weatherInfoRequestPrefix + uviQuery + apiKey + '&lat=' + cityLat + '&lon=' + cityLon,
      method: "GET"
    })
    .then(response => {
      uvIndex = response.value;
    })
    .then(() => {
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

let dateString = (unixTime => {
  return moment(unixTime).format('MM/DD/YYYY');
})

// PROBLEM HERE
let showValuesOnPage = (() => {
  let searchString = cityName + ', ' + countryCode;
  $('#city-name').text(searchString + ' (' + dateString(Date.now()) + ')');
  // save "cityName + ', ' + countryCode" to local storage with the time stamp
  addToSearchHistory(searchString, Date.now());
  $('#weather-icon').attr('src', iconURL + iconName + '.png')
  $('#temp-data').text('Temperature: ' + 
    (tempInK - 273.15).toFixed(2) + ' ' + String.fromCharCode(176) + 'C (' +
    ((tempInK - 273.15) * 9/5 + 32).toFixed(2) + ' ' + String.fromCharCode(176) + 'F)');
  $('#hum-data').text('Humidity: ' + humidity + '%');
  $('#wind-data').text('Wind Speed: ' + windSpeed + ' MPH');
  $('#uvi-data').text('UV Index: ' + uvIndex);
});

let setFiveDayData = (response => {
  let dataArray = response.list;
  let size = dataArray.length;
  let dayNumber = 1;
  for(let i = 0; i < size; i+=8) {
    $(`#five-day-${dayNumber}`).find('h6').text(dateString(dataArray[i].dt * 1000));
    $(`#five-day-${dayNumber}`).find('.weather-icon').attr('src', iconURL + dataArray[i].weather[0].icon + '.png');
    $(`#five-day-${dayNumber}`).find('.temp-5').text('Temperature: ' + 
      (dataArray[i].main.temp - 273.15).toFixed(2) + ' ' + String.fromCharCode(176) + 'C (' +
      ((dataArray[i].main.temp - 273.15) * 9/5 + 32).toFixed(2) + ' ' + String.fromCharCode(176) + 'F)');
    $(`#five-day-${dayNumber}`).find('.hum-5').text('Humidity: ' + dataArray[i].main.humidity + '%');
    ++ dayNumber;
  }
})

let saveToLocalStorage = (searchesObj => {
  return localStorage.setItem('searchHistory', JSON.stringify(searchesObj));
});

let addToSearchHistory = ((searchString, timeStamp) => {
  if(!localStorage.getItem('searchHistory')) {
    initializeLocalStorage();
  }

  let searchHistory = JSON.parse(localStorage.getItem('searchHistory'));
  console.log('search history object before addition', searchHistory);

  searchHistory[searchString] = timeStamp;
  console.log('search history object AFTER addition', searchHistory);

  saveToLocalStorage(searchHistory);
});
