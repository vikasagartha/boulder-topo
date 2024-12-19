import {readFileSync, writeFileSync} from 'fs'
import { spawnSync } from 'child_process'
import csvToArray from './csvToArray'

interface Ascent {
   id: string,
   route_boulder: 'BOULDER' | 'ROUTE',
   name: string,
   location_name: string,
   sector_name: string,
   area_name: string,
   country_code: string,
   date: string,
   difficulty: string,
   comment: string,
}

const ascentKeys = [
  'route_boulder',
  'name',
  'location_nam',
  'sector_name',
  'area_name',
  'country_code',
  'date',
  'difficulty',
  'comment',
]

interface GeoJSON {
    type: string,
    properties: Ascent,
    geometry: {
      type: string,
      coordinates: [Number, Number]
    }
}

const ascentToGeoJSON = (o: Ascent): GeoJSON => ({
   type: 'Feature',
   properties: o,
   geometry:{
      type: "Point",
      coordinates:[NaN,NaN]
   }
})

const arrays2Ascent = (keys: string[], values: string[]) : Ascent => {
   const invalidAscent = () :Ascent => ({
      id: crypto.randomUUID(),
      route_boulder: 'BOULDER',
      name: '',
      location_name: '',
      sector_name: '',
      area_name: '',
      country_code: '',
      date: '',
      difficulty: '',
      comment: '',
   })

   return Object.assign(invalidAscent(), keys.reduce((o, k, i) => ({...o, [k]: values[i]}), {}))
}

const parse8aCSV = async (filename: string) : Promise<GeoJSON[] | Error> => {

   let inputD

   try {
      inputD = await readFileSync(filename)
   } catch(err: unknown) {
      if(err instanceof Error){
         console.log('Error reading csv file: '+ err)
         return err
      }
      return Error('Error reading csv file')
   }

   const [keys, ...data] = csvToArray(inputD.toString(), ',')
   data.pop() //last line is a blank
   const features = data.map(values => ascentToGeoJSON(arrays2Ascent(keys, values)))

   let bugCount = 0
   const cleaned = features.filter((d, i) => {
      if(Object.values(d.properties).every(el => el === undefined || el === null || el === '')) {
            console.log(`Faulty Data. name: ${d.properties.name}. Located at index: ${i} in data of ${features.length-1} items.`)
            bugCount+=1
            return false
         }
         return true
   })

   if(bugCount>0) console.log('Total faulty data count: ' + bugCount + '. If this is the last item on the list, this is not unexpected. 8a incorrectly adds a blank line at the end of csv files.')
   return cleaned
}

const known = (s: string): boolean => !s.toLowerCase().includes('unknown') && s !== ''

interface Query {
   text: string,
   id: string
}

const buildQueryFile = async (filename: string) : Promise<string | Error> => {

   console
   const features = await parse8aCSV(filename)
   if(features instanceof Error) return features
   const queries : Query[] = features.map(({properties: {location_name, sector_name, area_name, country_code, id}}) => ({
      text: [location_name, sector_name, area_name, country_code].filter(known).join(', '),
      id
   }))
   const lines = queries.map((q, i) => ([q.id, `"${q.text}"`]).join(','))

   try {
      const fname = `${filename}-queries.csv`
      const success = await writeFileSync(fname, lines.join('\n'), 'utf8')
      return fname
   } catch (error: unknown){
      console.log('Error writing query file!')
      if(error instanceof Error) {
         return error
      }
      return Error('Unknown error writing query file.')

   }
}

const main = async (filename: string) : Promise<void> => {

   //Parse csv from 8a, convert to GeoJSON, and construct query strings to be fed into geocoder, write those to a csv.

   const features = await parse8aCSV(filename)
   if(features instanceof Error) return
   const queries : Query[] = features.map(({properties: {location_name, sector_name, area_name, country_code, id}}) => ({
      text: [location_name, sector_name, area_name, country_code].filter(known).join(', '),
      id
   }))
   const lines = queries.map((q, i) => ([q.id, `"${q.text}"`]).join(','))
   const response = await writeFileSync('./input.csv', lines.join('\n'), 'utf8')

   //Run python geocoder

   const sourceProcess = await spawnSync('source', ['envs/boulder-topo-env/bin/activate'])
   if(sourceProcess.stdout?.toString()?.trim() !== 'OK') {
      console.log('Error from python process: ' + sourceProcess.stderr?.toString()?.trim())
      return
   }

   const geocodeProcess = await spawnSync('source', ['python','batch_geocoder.py'])
   if(geocodeProcess.stdout?.toString()?.trim() !== 'OK') {
      console.log('Error from python process: ' + geocodeProcess.stderr?.toString()?.trim())
      return
   }

   //Update GeoJSON with geocoded data

   let googleData

   try {
      googleData = await readFileSync('./output.csv')
   } catch(err) {
      console.log('Error reading geocoded data file: '+ err)
      return
   }

   const [keys, ...data] = csvToArray(googleData.toString(), ',')
   console.log('keys', keys)
   console.log('data', data)
   //data.pop() //last line is a blank

}

export {buildQueryFile}