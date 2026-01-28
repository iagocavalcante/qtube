# yt-dlp Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace ytdl-core with yt-dlp to enable YouTube Shorts downloads and improve reliability.

**Architecture:** Spawn yt-dlp as a child process from the Express server. Create a helper module to wrap yt-dlp commands for getting video info, downloading videos, and downloading audio. Bundle yt-dlp binaries with the Electron app.

**Tech Stack:** Node.js child_process, yt-dlp CLI, Electron extraResources

---

### Task 1: Download yt-dlp Binaries

**Files:**
- Create: `bin/yt-dlp` (macOS/Linux binary)
- Create: `bin/yt-dlp.exe` (Windows binary)

**Step 1: Create bin directory and download binaries**

```bash
mkdir -p bin
cd bin
# Download macOS binary
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos -o yt-dlp
chmod +x yt-dlp
# Download Windows binary
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o yt-dlp.exe
```

**Step 2: Verify binaries work**

```bash
./bin/yt-dlp --version
```

Expected: Version number like `2024.01.01` or similar

**Step 3: Add bin to .gitignore (binaries are large)**

Add to `.gitignore`:
```
bin/yt-dlp
bin/yt-dlp.exe
```

**Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: add yt-dlp binaries to gitignore"
```

---

### Task 2: Create yt-dlp Helper Module

**Files:**
- Create: `src-electron/main-process/server/modules/ytdlp/index.js`

**Step 1: Create the ytdlp module directory**

```bash
mkdir -p src-electron/main-process/server/modules/ytdlp
```

**Step 2: Write the ytdlp helper module**

Create `src-electron/main-process/server/modules/ytdlp/index.js`:

```javascript
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

/**
 * Get the path to the yt-dlp binary based on platform and environment
 */
function getBinaryPath() {
  const platform = process.platform
  const binName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'

  // Check if running in packaged Electron app
  const isPackaged = process.mainModule?.filename?.includes('app.asar') ||
    process.argv[0]?.includes('Electron')

  let basePath
  if (isPackaged && process.resourcesPath) {
    basePath = path.join(process.resourcesPath, 'bin')
  } else {
    // Development: look in project root bin folder
    basePath = path.join(__dirname, '../../../../../bin')
  }

  return path.join(basePath, binName)
}

/**
 * Get video info from a YouTube URL
 * @param {string} url - YouTube URL (supports regular videos, shorts, etc.)
 * @returns {Promise<Object>} Video info object
 */
function getInfo(url) {
  return new Promise((resolve, reject) => {
    const ytdlp = getBinaryPath()
    const args = ['--dump-json', '--no-playlist', url]

    const proc = spawn(ytdlp, args)
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(stdout)
          resolve({
            title: info.title,
            description: info.description || '',
            thumbnail_url: info.thumbnail,
            duration: info.duration,
            videoId: info.id,
            channel: info.channel,
            viewCount: info.view_count
          })
        } catch (err) {
          reject(new Error(`Failed to parse video info: ${err.message}`))
        }
      } else {
        reject(new Error(parseError(stderr) || `yt-dlp exited with code ${code}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`))
    })
  })
}

/**
 * Download a video as MP4
 * @param {string} url - YouTube URL
 * @param {string} outputDir - Directory to save the video
 * @param {string} title - Sanitized title for the filename
 * @param {function} onProgress - Progress callback (percent, speed, eta)
 * @returns {Promise<string>} Path to downloaded file
 */
function downloadVideo(url, outputDir, title, onProgress) {
  return new Promise((resolve, reject) => {
    const ytdlp = getBinaryPath()
    const outputPath = path.join(outputDir, `${title}.mp4`)
    const thumbPath = path.join(outputDir, `${title}.jpg`)

    const args = [
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      '--merge-output-format', 'mp4',
      '-o', outputPath,
      '--write-thumbnail',
      '--convert-thumbnails', 'jpg',
      '--no-playlist',
      '--newline', // Progress on new lines for easier parsing
      url
    ]

    const proc = spawn(ytdlp, args)
    let stderr = ''

    proc.stdout.on('data', (data) => {
      const line = data.toString()
      const progress = parseProgress(line)
      if (progress && onProgress) {
        onProgress(progress)
      }
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        // Rename thumbnail if yt-dlp created it with different extension
        const possibleThumbs = [
          path.join(outputDir, `${title}.webp`),
          path.join(outputDir, `${title}.png`)
        ]
        for (const thumb of possibleThumbs) {
          if (fs.existsSync(thumb)) {
            fs.renameSync(thumb, thumbPath)
            break
          }
        }
        resolve(outputPath)
      } else {
        reject(new Error(parseError(stderr) || `Download failed with code ${code}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`))
    })
  })
}

/**
 * Download audio as MP3
 * @param {string} url - YouTube URL
 * @param {string} outputDir - Directory to save the audio
 * @param {string} title - Sanitized title for the filename
 * @param {function} onProgress - Progress callback
 * @returns {Promise<string>} Path to downloaded file
 */
function downloadAudio(url, outputDir, title, onProgress) {
  return new Promise((resolve, reject) => {
    const ytdlp = getBinaryPath()
    const outputPath = path.join(outputDir, `${title}.mp3`)

    const args = [
      '-x', // Extract audio
      '--audio-format', 'mp3',
      '--audio-quality', '128K',
      '-o', outputPath,
      '--write-thumbnail',
      '--convert-thumbnails', 'jpg',
      '--no-playlist',
      '--newline',
      url
    ]

    const proc = spawn(ytdlp, args)
    let stderr = ''

    proc.stdout.on('data', (data) => {
      const line = data.toString()
      const progress = parseProgress(line)
      if (progress && onProgress) {
        onProgress(progress)
      }
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath)
      } else {
        reject(new Error(parseError(stderr) || `Download failed with code ${code}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`))
    })
  })
}

/**
 * Parse yt-dlp progress output
 * @param {string} line - Line from stdout
 * @returns {Object|null} Progress object or null
 */
function parseProgress(line) {
  // Match: [download]  45.2% of 50.00MiB at 2.50MiB/s ETA 00:15
  const match = line.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+(\S+)\s+at\s+(\S+)\s+ETA\s+(\S+)/)
  if (match) {
    return {
      percent: parseFloat(match[1]),
      size: match[2],
      speed: match[3],
      eta: match[4]
    }
  }
  return null
}

/**
 * Parse yt-dlp error output into user-friendly message
 * @param {string} stderr - Error output from yt-dlp
 * @returns {string|null} User-friendly error message
 */
function parseError(stderr) {
  if (stderr.includes('Video unavailable')) {
    return 'This video is private or has been deleted'
  }
  if (stderr.includes('Sign in to confirm your age')) {
    return 'Age-restricted video, cannot download'
  }
  if (stderr.includes('not available in your country')) {
    return 'Video not available in your region'
  }
  if (stderr.includes('is not a valid URL')) {
    return 'Invalid YouTube URL'
  }
  if (stderr.includes('Unable to extract')) {
    return 'Unable to extract video information'
  }
  return null
}

module.exports = {
  getBinaryPath,
  getInfo,
  downloadVideo,
  downloadAudio
}
```

**Step 3: Export the module**

Modify `src-electron/main-process/server/modules/index.js`:

```javascript
module.exports = {
  manipulateFiles: require('./manipulate-files'),
  ytdlp: require('./ytdlp')
}
```

**Step 4: Commit**

```bash
git add src-electron/main-process/server/modules/
git commit -m "feat: add yt-dlp helper module"
```

---

### Task 3: Update Server to Use yt-dlp

**Files:**
- Modify: `src-electron/main-process/server/server.js`

**Step 1: Replace ytdl-core imports with ytdlp module**

Remove these lines:
```javascript
const ytdl = require('ytdl-core')
const getInfoVideo = promisify(ytdl.getInfo)
```

The `modules` require already includes ytdlp.

**Step 2: Update /api/download endpoint**

Replace the existing `/api/download` handler with:

```javascript
app.post('/api/download', async (req, res) => {
  try {
    const info = await modules.ytdlp.getInfo(req.body.youtubeUrl)
    const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, "")
    const outputDir = path.join(__statics, `videos/${title}/`)
    modules.manipulateFiles.createDir(outputDir)

    await modules.ytdlp.downloadVideo(req.body.youtubeUrl, outputDir, title, (progress) => {
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
```

**Step 3: Update /api/download-mp3 endpoint**

Replace the existing `/api/download-mp3` handler with:

```javascript
app.post('/api/download-mp3', async (req, res) => {
  try {
    const info = await modules.ytdlp.getInfo(req.body.youtubeUrl)
    const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, "")
    const outputDir = path.join(__statics, `musics/${title}/`)
    modules.manipulateFiles.createDir(outputDir)

    const musicPath = await modules.ytdlp.downloadAudio(req.body.youtubeUrl, outputDir, title, (progress) => {
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
```

**Step 4: Update /api/download-playlist endpoint**

Replace with:

```javascript
app.post('/api/download-playlist', async (req, res) => {
  try {
    const info = await modules.ytdlp.getInfo(req.body.youtubeUrl)
    const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, "")
    const outputDir = path.join(__statics, `musics/${title}/`)
    modules.manipulateFiles.createDir(outputDir)

    const musicPath = await modules.ytdlp.downloadAudio(req.body.youtubeUrl, outputDir, title)

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
```

**Step 5: Add helper function for database insertion**

Add this helper function before the routes:

```javascript
function insertToDatabase(__statics, ytdown, type) {
  fs.readFile(path.join(__statics, 'database/ytdown.json'), function (err, content) {
    if (err) {
      console.log(err)
      return
    }
    const yt = JSON.parse(content)
    if (type === 'mp3')
      yt.musics.push(ytdown)
    else
      yt.videos.push(ytdown)
    fs.writeFile(path.join(__statics, 'database/ytdown.json'), JSON.stringify(yt), function (err) {
      if (err) console.log(err)
    })
  })
}
```

**Step 6: Remove /api/thumbnail and /api/insert routes**

These are no longer needed since yt-dlp handles thumbnails and we insert directly.

**Step 7: Remove unused imports**

Remove these lines:
```javascript
const { promisify } = require('util')
const request = require('request')
const ffmpeg = require('fluent-ffmpeg')
```

Also remove the `playlist` function as it's replaced.

**Step 8: Commit**

```bash
git add src-electron/main-process/server/server.js
git commit -m "feat: replace ytdl-core with yt-dlp in server"
```

---

### Task 4: Update Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Remove ytdl-core dependency**

```bash
npm uninstall ytdl-core
```

**Step 2: Remove request dependency (no longer needed)**

```bash
npm uninstall request
```

**Step 3: Verify package.json**

Confirm `ytdl-core` and `request` are removed from dependencies.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove ytdl-core and request dependencies"
```

---

### Task 5: Configure Electron Builder for Binary Bundling

**Files:**
- Modify: `quasar.config.js`

**Step 1: Add extraResources to electron builder config**

In `quasar.config.js`, update the `electron.builder` section:

```javascript
builder: {
  appId: 'qtube',
  publish: {
    provider: 'github',
    owner: 'iagocavalcante',
    repo: 'qtube'
  },
  win: {
    target: 'nsis'
  },
  mac: {
    target: 'dmg'
  },
  linux: {
    target: 'AppImage'
  },
  extraResources: [
    {
      from: 'bin/',
      to: 'bin/',
      filter: ['yt-dlp*']
    }
  ]
}
```

**Step 2: Commit**

```bash
git add quasar.config.js
git commit -m "chore: configure electron-builder to bundle yt-dlp"
```

---

### Task 6: Test the Integration

**Step 1: Start the development server**

```bash
npm run dev
```

**Step 2: Test regular video download**

Enter URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
Expected: Video downloads successfully as MP4

**Step 3: Test YouTube Shorts download**

Enter URL: `https://www.youtube.com/shorts/iemAo81D7CE`
Expected: Shorts video downloads successfully as MP4

**Step 4: Test MP3 download**

Expected: Audio extracts and converts to MP3

**Step 5: Verify files are saved correctly**

Check `~/Downloads/Ytdown/videos/` and `~/Downloads/Ytdown/musics/` for:
- Video/audio file
- Thumbnail image
- Entry in `ytdown.json` database

---

### Summary of Changes

| File | Change |
|------|--------|
| `bin/yt-dlp` | Add macOS/Linux binary |
| `bin/yt-dlp.exe` | Add Windows binary |
| `.gitignore` | Ignore binaries |
| `src-electron/main-process/server/modules/ytdlp/index.js` | New yt-dlp wrapper module |
| `src-electron/main-process/server/modules/index.js` | Export ytdlp module |
| `src-electron/main-process/server/server.js` | Replace ytdl-core with yt-dlp |
| `package.json` | Remove ytdl-core, request |
| `quasar.config.js` | Add extraResources for binaries |
