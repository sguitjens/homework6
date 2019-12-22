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
  let searchHx = JSON.parse(localStorage.getItem('searchHistory'));
  renderSearchHistory();
})

const renderSearchHistory = () => {
  let searchHx = JSON.parse(localStorage.getItem('searchHistory'));
  if(searchHx) {
    arrayLength = searchHx.length;
    for(let i = 0; i < arrayLength; ++i) {
      $(`#row${i}`).html(`<td><button class="recent${i} btn btn-link p-0 text-muted">${searchHx[i].searchString}</button></td>`);
      $( "table" ).on( "click", "button", function( event ) {
        event.preventDefault();
        getWeatherInformation($(this).text());
        console.log("INDEX", index);
      })
    }
  }
}

/* TODO:
recentSearches = [obj{citySearch: "Portland, US", timeStamp: 0123973483}]
1. validate the city name and if it's good, get the weather info from the APIs and update 
2. If it's good, pull the array from local storage and search for the city name
2a. If it's there, update the time stamp
2b. If it's not there, add it to the array
3. Sort the array by time stamp
4. Delete the oldest (last) item from the array if there are more than ten items
5. Update the recent searches list in the UI from the array
6. Save the array to local storage (replace the existing one)
searchHistory []
*/

// display the last ten searches:
let displaySearchHistory = searchHx => {
  // localStorage.clear();
  let index = 0;
  console.log("searchhistory", searchHx);
  // SORT HERE
  searchHx.sort((a, b) => {
    return a.timeStamp + b.timeStamp;
  });

  let arrayLength = searchHx.length;
  // truncate search history if it's longer than ten - NOT WORKING
  let result = ''
  while(arrayLength > 10) {
    console.log("ARRAY BEFORE POP", searchHx);
    result = searchHx.pop();
    console.log("POPPED", result);
    console.log("ARRAY AFTER POP", searchHx);
    arrayLength = searchHx.length;
  }

  // update local storage
  // localStorage.clear();
  console.log("::::::::Array NOW::::::::", searchHx);
  localStorage.setItem(searchHistory, searchHx);

  // display
  for(let i = 0; i < arrayLength; ++i) {
    $(`#row${i}`).html(`<td><button class="recent${i} btn btn-link p-0 text-muted">${searchHx[i].cityName}</button></td>`);
    $( "table" ).on( "click", "button", function( event ) {
      event.preventDefault();
      getWeatherInformation($(this).text());
      console.log("INDEX", index);
    })
  }
}

let initializeLocalStorage = (() => {
  localStorage.setItem('searchHistory', '[]');
  console.log('LOCAL STORAGE', localStorage.getItem(searchHistory));
});

$('#city-search').click(() => {
  event.preventDefault();
  let citySearchString = validatedSearchString($('input').attr("placeholder", "City Name").val());
  getWeatherInformation(citySearchString);
})

$('input').keypress(event => {
  if (event.which == 13) {
    event.preventDefault();
    let citySearchString = validatedSearchString($('input').attr("placeholder", "City Name").val());
    getWeatherInformation(citySearchString);
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

let showValuesOnPage = (() => {
  let searchString = cityName + ', ' + countryCode;
  $('#city-name').text(searchString + ' (' + dateString(Date.now()) + ')');
  addToSearchHistory(searchString, Date.now());
  renderSearchHistory();
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

// TODO: make searchesObj into an array instead of an object
let saveToLocalStorage = (searchHx => {
  return localStorage.setItem('searchHistory', JSON.stringify(searchHx));
});

const addToSearchHistory = (searchString, timeStamp) => {
  let obj = {
    "searchString": searchString,
    "timeStamp": timeStamp
  }
  let searchHx = JSON.parse(localStorage.getItem('searchHistory'));
  console.log("search history before being added", searchHx);
  if(!searchHx) {
    searchHx = [];
  }
  searchHx.push(obj);
  console.log("search history after being added", searchHx);
  saveToLocalStorage(searchHx);
}
