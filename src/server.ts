import {writeFile} from 'fs'

import express from 'express';
const multer = require('multer');
const app = express()
const port = 3000

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, './');
  },
  filename: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, Date.now() + '-' + file.originalname);
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

app.post('/upload', upload.single('file'), (req: express.Request, res: express.Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
  }
  else {
    res.json({ message: 'File uploaded successfully', filename: req.file.filename });
  }

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
