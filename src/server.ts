import {writeFile} from 'fs'
import express from 'express'
import multer from 'multer'
import {buildQueryFile} from './backend/index'

const app = express()
const port = 3000

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, __dirname+'/data');
  },
  filename: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, Date.now() + '-data.csv');
  },
});

const upload = multer({ storage });

app.get('/', (req: express.Request, res:express.Response) => {
  res.sendFile(__dirname + '/index.html');
})

app.get('/index.js', (req: express.Request, res:express.Response) => {
  res.sendFile(__dirname + '/frontend/index.js');
})

app.get('/styles.css', (req: express.Request, res:express.Response) => {
  res.sendFile(__dirname + '/styles.css');
})

app.post('/upload', upload.single('file'), async (req: express.Request, res: express.Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
  }
  else {
    const dataPath = `${__dirname}/data/${req.file.filename}`
    const queryPath = await buildQueryFile(dataPath)

    if(queryPath instanceof Error) {
      res.status(400).send({message: 'Your data was successfully uploaded, but there was an error building a query file for geocoding your data. Please contact admin: vikasagartha@gmail.com'});
    } else {
      res.json({ message: 'Query file generated!', dataPath, queryPath});
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
