const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const ytdl = require('ytdl-core')
const { promisify } = require('util')
const cors = require('cors')
const getInfoVideo = promisify(ytdl.getInfo)
const modules = require('./modules')
const request = require('request');

export const listen = (__statics) => {
  const app = express()
  
  app.use(bodyParser.json({ limit: '250mb' }));
  app.use(bodyParser.urlencoded({ limit: '250mb', extended: true }));
  app.use(cors())
  app.use(express.static(path.join(__statics, 'videos')))
  
  app.post('/api/download', async (req, res) => {
    try {
      const info = await getInfoVideo(req.body.youtubeUrl.replace('https://www.youtube.com/watch?v=', ''))
      modules.manipulateFiles.createDir(path.join(__statics, `videos/${info.title}/`))
      ytdl(req.body.youtubeUrl)
        .pipe(fs.createWriteStream(path.join(__statics, `videos/${info.title}/${info.title.replace('!!', '').replace('|', '').replace('|', '').replace(',', '').replace('|', '')}.mp4`)))
        .on('finish', () => {
          request.post('http://localhost:3000/api/thumbnail', { form: { info: info } })
          res.status(200).json({ video: `ok` })
        })
    } catch (err) {
      res.status(500).json(err)
    }
  })
  
  app.get('/api/infos', (req, res) => {
    fs.readFile(path.join(__statics, 'database/ytdown.json'), function (err, content) {
      if (err) console.log(err)
      // if (err) res.status(500).json({ error: 'impossible insert data' })
      const yt = JSON.parse(content)
      res.status(200).json(yt)
    })
  })
  
  app.post('/api/thumbnail', (req, res) => {
    const info = req.body.info
    request.get(info.thumbnail_url).pipe(fs.createWriteStream(path.join(__statics, `videos/${info.title}/${info.title}.jpg`)))
      .on('finish', () => {
        request.post('http://localhost:3000/api/insert', { form: { info: info } })
        res.status(200).json({ img: `ok` })
      })
  })
  
  app.post('/api/insert', (req, res) => {
    const info = req.body.info
    const ytdown = {
      title: info.title,
      description: info.description,
      thumbnail: `videos/${info.title}/${info.title}.jpg`,
      src: `videos/${info.title}/${info.title}.mp4`
    }
    let yt = {}
    fs.readFile(path.join(__statics, 'database/ytdown.json'), function (err, content) {
      if (err) console.log(err)
      // if (err) res.status(500).json({ error: 'impossible insert data' })
      yt = JSON.parse(content)
      yt.ytdown.push(ytdown)
      fs.writeFile(path.join(__statics, 'database/ytdown.json'), JSON.stringify(yt), function (err) {
        // if (err) res.status(500).json({ error: 'impossible insert data' })
        if (err) console.log(err)
      })
    })
    res.status(200).json({ img: `ok` })
  })

  app.listen(3000)
}

export default {
  listen
}