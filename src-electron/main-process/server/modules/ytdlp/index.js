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
