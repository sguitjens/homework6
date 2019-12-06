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

let updateSearchHistory = (() => {
  // localStorage.clear();
  const searchHistoryObject = JSON.parse(localStorage.getItem('searchHistory'));
  console.log("searchHistoryObject", searchHistoryObject);
  if(searchHistoryObject === null) {
    console.log("NULL")
    initializeLocalStorage();
  } else {
    console.log("SEARCH HISTORY OBJECT", searchHistoryObject);
    const searchHistoryArray = [];
    // console.log("ARRAY FROM OBJECT", searchHistoryArray);

    for (let [key, value] of Object.entries(searchHistoryObject)) {
      console.log([`${key}`, `${value}`]);
      searchHistoryArray.push([`${key}`, `${value}`]); 
    }
    console.log("SEARCH HISTORY ARRAY", searchHistoryArray);
    if(searchHistoryArray) {
      displaySearchHistory(searchHistoryArray);
    }
  }
})

// display the last ten searches
let displaySearchHistory = (searchArray => {
  let index = 0;
  console.log("ARRAY FOREACH ISSUE", searchArray);
  
  searchArray.forEach(item => {
    $(`#row${index}`).html(`<td><button class="recent${index} btn btn-link p-0 text-muted">${item[index]}</button></td>`);
    $( "table" ).on( "click", "button", function( event ) {
      event.preventDefault();
      getWeatherInformation($(this).text());
      console.log("INDEX", index);
      
      ++index;
    })
  })

    
})

let initializeLocalStorage = (() => {
  localStorage.setItem('searchHistory', '{}');
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

let showValuesOnPage = (() => { // this updates search history display, I think
  let searchString = cityName + ', ' + countryCode;
  $('#city-name').text(searchString + ' (' + dateString(Date.now()) + ')');
  // save "cityName + ', ' + countryCode" to local storage with the time stamp
  let result = addToSearchHistory(searchString, Date.now());
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



let saveToLocalStorage = ((searchesObj) => { // returns???
  return localStorage.setItem('searchHistory', JSON.stringify(searchesObj));
});

let addToSearchHistory = ((searchString, timeStamp) => { // returns the search history object
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

// retrieve search history from local storage, sort it, trim it, convert it into an array
let retrieveFromLocalStorage = (localStorageObject => {
  // let recentSearchList = localStorage.getItem(localStorageObject);// I think we can skip this and send in the getItem
  console.log("RECENT SEARCH LIST", localStorageObject);
  let recentSearchArray = {};
  if(localStorageObject) {
    recentSearchArray = Object.entries(localStorageObject);
    recentSearchArray.sort(function(a, b) {
      return (a[1] - b[1]);
    })
  }
  // if(Object.entries(localStorageObject)) {
  //   recentSearchArray = Object.entries(localStorageObject);
  // }
  console.log('object', localStorageObject);
  console.log('array', recentSearchArray);
  // return sortByLastSearch(localStorage.getItem(objName));
  // recentSearchArray.sort(function(a, b) {
  //   return (a[1] - b[1]);
  // })
  if(recentSearchArray.length > 10) {
    recentSearchArray.splice(10, 1);
  }
  return recentSearchArray; // return an array
})



/* END OF LOCAL STORAGE FUNCTIONS */

// let searchHistory = {
//   'Portland': 1575071887,
//   'Moscow, RU': 1575075000,
//   'London, UK': 1575072014
// }

// console.log('searchHistory', searchHistory);
// displaySearchHistory(Object.entries(searchHistory));

/*
1. display search history: takes a sorted array
2. update local storage: add/update search terms in local storage (I think this is done)
3. retrieve search history from local storage: return an array (DONE)
4. trim list: get rid of > 10 searches takes an array, updates local storate, (and returns the updated array?)
  do this after adding the new search (DONE? ONLOAD DOES THIS, WHAT ABOUT AFTER)
5. make onclick event for each button (DONE)
6. add a document ready function to load the data (DONE)

convert array to object: Object.fromEntries()
convert object to array: Object.entries()

add the search term to the object when the search is performed
*/
