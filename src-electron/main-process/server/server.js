const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const ytdl = require('ytdl-core')
const { promisify } = require('util')
const cors = require('cors')
const getInfoVideo = promisify(ytdl.getInfo)
const modules = require('./modules')
const request = require('request')
const ffmpeg = require('fluent-ffmpeg')
export const listen = (__statics) => {
  const app = express()

  app.use(bodyParser.json({ limit: '250mb' }));
  app.use(bodyParser.urlencoded({ limit: '250mb', extended: true }));
  app.use(cors())
  app.use(express.static(path.join(__statics, 'videos')))

  app.post('/api/download', async (req, res) => {
    try {
      const info = await getInfoVideo(req.body.youtubeUrl.replace('https://www.youtube.com/watch?v=', ''))
      const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, "")
      modules.manipulateFiles.createDir(path.join(__statics, `videos/${title}/`))
      ytdl(req.body.youtubeUrl)
        .pipe(fs.createWriteStream(path.join(__statics, `videos/${title}/${title}.mp4`)))
        .on('finish', () => {
          request.post('http://localhost:3000/api/thumbnail', { form: { info: info } })
          res.status(200).json({ video: `ok` })
        })
    } catch (err) {
      res.status(500).json(err)
    }
  })

  app.post('/api/download-mp3', async (req, res) => {
    try {
      const videoId = req.body.youtubeUrl.replace('https://www.youtube.com/watch?v=', '')
      const info = await getInfoVideo(videoId)
      const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, "")
      modules.manipulateFiles.createDir(path.join(__statics, `musics/${title}/`))
      const stream = ytdl(videoId, {
        quality: 'highestaudio',
        filter: 'audioonly',
      })
      ffmpeg(stream)
        .audioBitrate(128)
        .save(path.join(__statics, `musics/${title}/${title}.mp3`))
        .on('progress', (p) => {
          console.log(`${p.targetSize}kb downloaded`);
        })
        .on('end', () => {
          request.post('http://localhost:3000/api/thumbnail', { form: { info: info, type: 'mp3' } })
          res.status(200).json({ musicLink: path.join(__statics, `musics/${title}/${title}.mp3`) })
        })
    } catch (err) {
      res.status(500).json(err)
    }
  })

  app.post('/api/download-playlist', async (req, res) => {
    try {
      const videoId = req.body.youtubeUrl
      const info = await getInfoVideo(videoId)
      const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, "")
      modules.manipulateFiles.createDir(path.join(__statics, `musics/${title}/`))
      playlist(videoId, title)
      res.status(200).json({ musicLink: path.join(__statics, `musics/${title}/${title}.mp3`) })
    } catch (err) {
      res.status(500).json(err)
    }
  })

  const playlist = (videoId, title) => {
    const stream = ytdl(videoId, {
      quality: 'highestaudio',
      filter: 'audioonly',
    })

    stream.on('error', function error(err) {
      console.log(err.stack);
    });

    var size = 0;
    stream.on('info', function (info) {
      size = info.size;
      var output = path.join(__statics, `musics/${title}/${title}.mp3`);
      stream.pipe(fs.createWriteStream(output));
    });

    var pos = 0;
    stream.on('data', function data(chunk) {
      pos += chunk.length;
      // `size` should not be 0 here.
      if (size) {
        var percent = (pos / size * 100).toFixed(2);
        process.stdout.cursorTo(0);
        process.stdout.clearLine(1);
        process.stdout.write(percent + '%');
      }
    });

    stream.on('next', playlist);
  }

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
    const type = req.body.type
    const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, "")
    const filePath = type === 'mp3' ? path.join(__statics, `musics/${title}/${title}.jpg`) : path.join(__statics, `videos/${title}/${title}.jpg`)
    request.get(info.thumbnail_url).pipe(fs.createWriteStream(filePath))
      .on('finish', () => {
        request.post('http://localhost:3000/api/insert', { form: { info: info, type: type } })
        res.status(200).json({ img: `ok` })
      })
  })

  app.post('/api/insert', (req, res) => {
    const info = req.body.info
    const type = req.body.type
    const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, "")
    const ytdown = {
      title: title,
      description: info.description,
      thumbnail: type === 'mp3' ? `musics/${title}/${title}.jpg` : `videos/${title}/${title}.jpg`,
      src: type === 'mp3' ? `musics/${title}/${title}.mp3` : `videos/${title}/${title}.mp4`
    }
    let yt = {}
    fs.readFile(path.join(__statics, 'database/ytdown.json'), function (err, content) {
      if (err) console.log(err)
      // if (err) res.status(500).json({ error: 'impossible insert data' })
      yt = JSON.parse(content)
      if (type === 'mp3') 
        yt.musics.push(ytdown)
      else
        yt.videos.push(ytdown)
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