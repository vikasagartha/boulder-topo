const fs = require('fs')
console.log('welcome. converting 8a csv to geoJSON----------')

const csvToFeatures = (csv) => {
   const [r1, ...rest] = csv.split(/\r?\n/)
   const keys = r1.split(',')
   const features = rest.map(d => d.split(','))
   return features.map(values => keys.reduce((o, k, i) => ({...o, [k]: values[i]}), {}))
}
fs.readFile('vikas-8a.csv', "utf8", (err, inputD) => {
   if (err) throw err;
   console.log(csvToFeatures(inputD))
})