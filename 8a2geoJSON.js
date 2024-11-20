const fs = require('fs')
console.log('welcome. converting 8a csv to geoJSON----------')

//Good https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=9%20E%20Fort%20Ave,%20Baltimore,%20MD&benchmark=Public_AR_Current&format=json
//Bad. https://geocoding.geo.census.gov/geocoder?/locations/onelineaddress?address=9+E+Fort+Ave%2C+Baltimore%2C+MD&benchmark=Public_AR_Current&format=json

function CSVToArray (CSV_string, delimiter) {
   delimiter = (delimiter || ","); // user-supplied delimeter or default comma

   var pattern = new RegExp( // regular expression to parse the CSV values.
     ( // Delimiters:
       "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
       // Quoted fields.
       "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
       // Standard fields.
       "([^\"\\" + delimiter + "\\r\\n]*))"
     ), "gi"
   );

   var rows = [[]];  // array to hold our data. First row is column headers.
   // array to hold our individual pattern matching groups:
   var matches = false; // false if we don't find any matches
   // Loop until we no longer find a regular expression match
   while (matches = pattern.exec( CSV_string )) {
       var matched_delimiter = matches[1]; // Get the matched delimiter
       // Check if the delimiter has a length (and is not the start of string)
       // and if it matches field delimiter. If not, it is a row delimiter.
       if (matched_delimiter.length && matched_delimiter !== delimiter) {
         // Since this is a new row of data, add an empty row to the array.
         rows.push( [] );
       }
       var matched_value;
       // Once we have eliminated the delimiter, check to see
       // what kind of value was captured (quoted or unquoted):
       if (matches[2]) { // found quoted value. unescape any double quotes.
        matched_value = matches[2].replace(
          new RegExp( "\"\"", "g" ), "\""
        );
       } else { // found a non-quoted value
         matched_value = matches[3];
       }
       // Now that we have our value string, let's add
       // it to the data array.
       rows[rows.length - 1].push(matched_value);
   }
   return rows; // Return the parsed data Array
}

async function addressToCoordinates(address) {

   const base_url = 'https://geocoding.geo.census.gov/geocoder'
   const return_type = '/locations'
   const search_type = '/onelineaddress'
   const params = {
    address,
    'benchmark': 'Public_AR_Current',
    'format': 'json'
   }
  const url = (
    base_url + return_type + search_type + '?'+
    new URLSearchParams(params).toString()
  );

  const {result} = await fetch(url)
    .then(response => response.json());

  const {addressMatches: [first, ...rest]} = result
  return {latitude: first.coordinates.y, longitude: first.coordinates.x}
}

objToGeoJSON = obj => ({
   type: 'Feature',
   properties: {
         //dump all 8a properties
      ...obj
   },
   geometry:{
      type: "Point",
      coordinates:[NaN,NaN]
   }
})

const isKnown = s => {
   console.log(s)
   return !s.toLowerCase().includes('unknown')
}
const removeExtraQuotes = str => str.replace(/^"(.*)"$/, '$1')

//['a','b','c'], [1,2,3] => {a:1,b:2,c:3}
const arrays2Obj = (keys, values) => keys.reduce((o, k, i) => ({...o, [k]: values[i]}), {})

const csvToFeatures = (csv) => {
   const [r1, ...rest] = csv.split(/\r?\n/)
   const keys = r1.split(',').map(removeExtraQuotes)
   const features = rest.map(d => d.split(',').map(removeExtraQuotes))
   const objects = features
   return objects.map(objToGeoJSON)
}

fs.readFile('vikas-8a.csv', "utf8", (err, inputD) => {
   if (err) throw err;
   const [keys, ...data] = CSVToArray(inputD, ',')
   const features = data.map(values => objToGeoJSON(arrays2Obj(keys, values)))

   let bugCount = 0
   const cleaned = features.filter((d, i) => {
      if(Object.values(d.properties).every(el => el === undefined || el === null || el === '')) {
            console.log(`Faulty Data. name: ${d.name}. Located at index: ${i} in data of ${features.length-1} items.`)
            bugCount+=1
            return false
         }
         return true
   })

   if(bugCount>0) console.log('Total faulty data count: ' + bugCount + '. If this is the last item on the list, this is not unexpected. 8a incorrectly adds a blank line at the end of csv files.')

   const geoJSON = {
      type: 'FeatureCollection',
      features: cleaned
   }

   //console.log(buggy)
   // console.log(features.map(({
   //    properties: {location_name, sector_name, area_name}
   // }) => [location_name,sector_name,area_name].filter(isKnown).join(',')))
   //const addresses = features.map(f => f.properties)
   //addressToCoordinates('1214 61st St, Oakland, CA 94608').then(console.log)
})