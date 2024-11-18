const fs = require('fs')
console.log('welcome. converting 8a csv to geoJSON----------')

async function doAsyncTask() {

   const base_url = 'https://geocoding.geo.census.gov/geocoder?'
   const return_type = '/locations'
   const search_type = '/onelineaddress'
   const params = {
    'address': '9 E Fort Ave, Baltimore, MD',
    'benchmark': 'Public_AR_Current',
    'format': 'json'
   }
  const url = (
    base_url + return_type + search_type + '?'+
    new URLSearchParams(params).toString()
  );

   console.log(new URLSearchParams(params).toString())
  //console.log(url)

  const result = await fetch(url)
    .then(response => response.json());

  console.log('Fetched from: ' + url);
  console.log(result);
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

//['a','b','c'], [1,2,3] => {a:1,b:2,c:3}
const arrays2Obj = (keys, values) => keys.reduce((o, k, i) => ({...o, [k]: values[i]}), {})

const csvToFeatures = (csv) => {
   const [r1, ...rest] = csv.split(/\r?\n/)
   const keys = r1.split(',')
   const features = rest.map(d => d.split(','))
   const objects = features.map(values => arrays2Obj(keys, values))
   return objects.map(objToGeoJSON)
}
fs.readFile('vikas-8a.csv', "utf8", (err, inputD) => {
   if (err) throw err;
   // const features = csvToFeatures(inputD)
   // const geoJSON = {
   //    type: 'FeatureCollection',
   //    features
   // }
   doAsyncTask()
})