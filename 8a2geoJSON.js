const fs = require('fs')
console.log('welcome. converting 8a csv to geoJSON----------')

const readCSV = (data) => {
   return data.split('/\r\n|\n/').map(d => d.split(','))
}
fs.readFile('vikas-8a.csv', "utf8", (err, inputD) => {
   if (err) throw err;
   console.log(readCSV(inputD))
})
