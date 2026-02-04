import express from 'express'
import bodyParser from 'body-parser'
import fs from 'fs'
import path from 'path'
import cors from 'cors'
import { manipulateFiles, ytdlp } from './modules/index.js'

function getDefaultDatabase() {
  return { videos: [], musics: [] }
}

function ensureDatabaseExists(__statics) {
  const dbPath = path.join(__statics, 'database/ytdown.json')
  const dbDir = path.join(__statics, 'database')

  // Create directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // Create file if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(getDefaultDatabase()))
  }

  return dbPath
}

function readDatabase(__statics) {
  const dbPath = ensureDatabaseExists(__statics)
  try {
    const content = fs.readFileSync(dbPath, 'utf-8')
    if (!content || content.trim() === '') {
      return getDefaultDatabase()
    }
    return JSON.parse(content)
  } catch (err) {
    console.error('Error reading database:', err)
    return getDefaultDatabase()
  }
}

function writeDatabase(__statics, data) {
  const dbPath = ensureDatabaseExists(__statics)
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Error writing database:', err)
  }
}

function insertToDatabase(__statics, ytdown, type) {
  const yt = readDatabase(__statics)
  if (type === 'mp3') {
    yt.musics.push(ytdown)
  } else {
    yt.videos.push(ytdown)
  }
  writeDatabase(__statics, yt)
}

export const listen = (__statics) => {
  const app = express()

  app.use(bodyParser.json({ limit: '250mb' }));
  app.use(bodyParser.urlencoded({ limit: '250mb', extended: true }));
  app.use(cors())
  app.use(express.static(path.join(__statics, 'videos')))

  app.post('/api/download', async (req, res) => {
    try {
      const info = await ytdlp.getInfo(req.body.youtubeUrl)
      const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, "")
      const outputDir = path.join(__statics, `videos/${title}/`)
      manipulateFiles.createDir(outputDir)

      await ytdlp.downloadVideo(req.body.youtubeUrl, outputDir, title, (progress) => {
        console.log(`Download progress: ${progress.percent}%`)
      })

      // Insert into database
      const ytdown = {
        title: title,
        description: info.description,
        thumbnail: `videos/${title}/${title}.jpg`,
        src: `videos/${title}/${title}.mp4`
      }
      insertToDatabase(__statics, ytdown, 'video')

      res.status(200).json({ video: 'ok' })
    } catch (err) {
      console.error('Download error:', err)
      res.status(500).json({ error: err.message })
    }
  })

  app.post('/api/download-mp3', async (req, res) => {
    try {
      const info = await ytdlp.getInfo(req.body.youtubeUrl)
      const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, "")
      const outputDir = path.join(__statics, `musics/${title}/`)
      manipulateFiles.createDir(outputDir)

      const musicPath = await ytdlp.downloadAudio(req.body.youtubeUrl, outputDir, title, (progress) => {
        console.log(`Download progress: ${progress.percent}%`)
      })

      // Insert into database
      const ytdown = {
        title: title,
        description: info.description,
        thumbnail: `musics/${title}/${title}.jpg`,
        src: `musics/${title}/${title}.mp3`
      }
      insertToDatabase(__statics, ytdown, 'mp3')

      res.status(200).json({ musicLink: musicPath })
    } catch (err) {
      console.error('Download error:', err)
      res.status(500).json({ error: err.message })
    }
  })

  app.post('/api/download-playlist', async (req, res) => {
    try {
      const info = await ytdlp.getInfo(req.body.youtubeUrl)
      const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, "")
      const outputDir = path.join(__statics, `musics/${title}/`)
      manipulateFiles.createDir(outputDir)

      const musicPath = await ytdlp.downloadAudio(req.body.youtubeUrl, outputDir, title)

      // Insert into database
      const ytdown = {
        title: title,
        description: info.description,
        thumbnail: `musics/${title}/${title}.jpg`,
        src: `musics/${title}/${title}.mp3`
      }
      insertToDatabase(__statics, ytdown, 'mp3')

      res.status(200).json({ musicLink: musicPath })
    } catch (err) {
      console.error('Download error:', err)
      res.status(500).json({ error: err.message })
    }
  })

  app.get('/api/infos', (req, res) => {
    const yt = readDatabase(__statics)
    res.status(200).json(yt)
  })

  app.listen(52847)
}

export default {
  listen
}
