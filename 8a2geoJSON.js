import fs from 'fs'
import csv2Array from './csv2Array.js'

async function batchGeoCode(queries) {

   const base_url = 'https://api.mapbox.com/search/geocode/v6/batch'
   const params = {
      access_token: 'pk.eyJ1Ijoiam9yZGl0b3N0IiwiYSI6ImQtcVkyclEifQ.vwKrOGZoZSj3N-9MB6FF_A',
   }
  const url = base_url + '?' + new URLSearchParams(params).toString()

  const body = queries.map(q => ({q: q.query, country: q.country, limit:1}))
  return await fetch(url, {
      headers: {
       "Content-Type": "application/json",
     },
      method: 'POST',
      body: JSON.stringify(body)
   })
   .then(response => {
      if(response.status !== 200) throw "Geocoding api failure."
      return response
   })
   .then(response => response.json())

}

const objToGeoJSON = obj => ({
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

const known = s => !s.toLowerCase().includes('unknown') && s !== ''

//['a','b','c'], [1,2,3] => {a:1,b:2,c:3}
const arrays2Obj = (keys, values) => keys.reduce((o, k, i) => ({...o, [k]: values[i]}), {})

async function main(filename){

   fs.readFile(filename, "utf8", async (err, inputD) => {
      if (err) throw err;
      const [keys, ...data] = csv2Array(inputD, ',')
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

      const queries = cleaned.map(({properties: {location_name, sector_name, area_name, country_code}}) => ({
         query: [location_name, sector_name, area_name, country_code].filter(known).join(', '),
         country: country_code
      }))

      const mapboxData = await batchGeoCode(queries)
         .then(({batch}) => batch.map((f, i) => ({
            geometry: f.features[0].geometry,
            properties: f.features[0].properties
         })))

      const geoJSON = {
         type: 'FeatureCollection',
         features: cleaned.map((c, i) => ({
            ...c,
            geometry: mapboxData[i].geometry,
            mapboxProperties: mapboxData[i].properties,
            mapboxQuery: queries[i]
         }))
      }

      fs.writeFile('boulders.json', JSON.stringify(geoJSON), 'utf8', () => console.log('written to boulders.json'));

     return geoJSON
   })
}

main('vikas-8a.csv')
