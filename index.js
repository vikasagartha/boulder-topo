const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})

app.get('/boulders.json', (req, res) => {
  res.sendFile(__dirname + '/boulders.json');
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})