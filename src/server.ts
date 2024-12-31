import {writeFile} from 'fs'
import express from 'express'
import multer from 'multer'
import { spawn } from 'child_process'
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
    return
  }

  const dataPath = `${__dirname}/data/${req.file.filename}`
  const queryPath = await buildQueryFile(dataPath)
  const pythonPath = process.env.PYTHON_BINARY

  if(queryPath instanceof Error) {
    res.status(400).send({message: 'Your data was successfully uploaded, but there was an error building a query file for geocoding your data. Please contact admin: vikasagartha@gmail.com'});
    return
  }

  if(!pythonPath || typeof pythonPath !== 'string') {
    res.status(400).send({message: 'Your data was successfully uploaded, but there was an error but ther was an error intitializing the python environment. Please contact admin: vikasagartha@gmail.com'});
    return
  }

  const pyProg = await spawn(pythonPath, ['./batch_geocoder.py', queryPath])

  pyProg.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
  });

  pyProg.stderr.on('data', (data) => {
    console.log('stderr: ' + data);
  });

  pyProg.on('close', code => {
    console.log(`child process exited with code ${code}`);
    if(code !== 0){
      res.status(400).send({
        message: 'There was an error geocoding your data. Please contact admin: vikasagartha@gmail.com',
        code
      });
    }
  })

  //res.json({ message: 'Query file generated, python sourced!', dataPath, queryPath, output, errorOutput})
  //setTimeout(() => res.json({ message: 'Query file generated, python sourced!', dataPath, queryPath}), 5000)

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
