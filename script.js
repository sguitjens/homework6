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
let weatherInfoRequestPrefix = 'http://api.openweathermap.org/data/2.5/';
let fiveDayRequestPrefix = 'https://api.openweathermap.org/data/2.5/forecast?q='; // + &mode=json
let uviQuery = 'uvi?'
let apiKey = '&appid=d5063d29f50830106cfbe3f17f54053f'                  
 
$('#city-search').click(() => {
  event.preventDefault();
  let citySearchString = validatedSearchString($('input').attr("placeholder", "City Name").val());
  // VALIDATE CITY NAME AND PARSE COUNTRY CODE, IF THERE IS ONE
  let cityQuery = 'weather?q=' + citySearchString;

  $.ajax({
    url: weatherInfoRequestPrefix + cityQuery + apiKey,
    method: "GET",
    error: (err => {
      console.log('ERROR WAS RETURNED', err);
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
  // save "cityName + ', ' + countryCode" to local storage with the time stamp
  let result = addToSearchHistory(searchString, Date.now());
  console.log('result of trying to add to search history', result);
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

/* LOCAL STORAE FUNCTIONS */

let initializeLocalStorage = (() => {
  localStorage.setItem('searchHistory', '{}');
});

let saveToLocalStorage = ((searchesObj) => {
  return localStorage.setItem('searchHistory', JSON.stringify(searchesObj));
});

let addToSearchHistory = ((searchString, timeStamp) => {
  // TODO: the search string that gets saved should be the one
  // that comes back from the service (that is displayed in the results)
  if(!localStorage.getItem('searchHistory')) {
    initializeLocalStorage();
  }

  let searchHistory = JSON.parse(localStorage.getItem('searchHistory'));
  console.log('search history object before addition', searchHistory);

  searchHistory[searchString] = timeStamp;
  console.log('search history object AFTER addition', searchHistory);

  return saveToLocalStorage(searchHistory);
});

let trimSearchHistory = (historyArray => {
  // this needs to happen when the search history object is retrieved from local storage
  // after it has been sorted by time
})

// retrieve search history from local storage, sort it and trim it
let retrieveFromLocalStorage = (objName => {
  let recentSearchList = localStorage.getItem(objName);
  let recentSearchArray = Object.entries(localStorage.getItem(objName));
  console.log('object', recentSearchList);
  console.lof('array', recentSearchArray);
  // return sortByLastSearch(localStorage.getItem(objName));
  recentSearchArray.sort((a, b) {
    return (a[1] - b[1]);
  })
  if(recentSearchArray.length > 10) {
    // TODO: delete the last item in the array (at index 10)
  }
  return localStorage.getItem(Object.entries(objName)); // return an array
})

// display the last ten searches
let displaySearchHistory = (searchArray => {
  let index = 0;

  console.log('sorted list', searchArray);
  searchArray.forEach(item => {
    console.log('each one', item)
    let buttonLocation = $(`#row${index}`);
    $(`#row${index}`).html(`<td><button class="recent${index} btn btn-link p-0 text-muted">${item[0]}</button></td>`);
    // $(`#recent${index}`).on('click', searchAgain()); // DOES NOT WORK??
    $(`#recent${index}`).on('click', function() {
      searchString = $(this).text();
      console.log("SEARCH STRING=", searchString);
    })
    
    ++index;
  })
})

let searchAgain = (() => {
  searchString = $(this).text();
  console.log("SEARCH STRING=", searchString);
})

/*
$("button").click(function() {
  value = $(this).siblings("textarea").val();
  hourString = $(this).siblings("div").text();
  
  saveSchedule(hourString, value);
});
*/

/* END OF LOCAL STORAGE FUNCTIONS */

let searchHistory = {
  'Portland': 1575071887,
  'Moscow, RU': 1575075000,
  'London, UK': 1575072014
}

console.log('searchHistory', searchHistory);
displaySearchHistory(Object.entries(searchHistory));

/*
1. display search history: takes a sorted array
2. update local storage: add/update search terms in local storage (I think this is done)
3. retrieve search history from local storage: return an array (this is done)
4. trim list: get rid of > 10 searches takes an array, updates local storate, (and returns the updated array?)
  do this after adding the new search
5. make onclick event for each button
6. add a document ready function to load the data

convert array to object: Object.fromEntries()
convert object to array: Object.entries()

add the search term to the object when the search is performed
*/
