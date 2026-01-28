# yt-dlp Integration Design

## Problem

YouTube Shorts URLs (`youtube.com/shorts/VIDEO_ID`) don't work with the current `ytdl-core` library. Additionally, `ytdl-core` has ongoing reliability issues as YouTube frequently changes their API.

## Solution

Replace `ytdl-core` with `yt-dlp`, a more actively maintained and reliable YouTube download tool.

## Architecture

### Current Flow
```
Frontend → Express API → ytdl-core (Node.js library) → File
```

### New Flow
```
Frontend → Express API → yt-dlp (CLI binary) → File
```

### Key Changes

1. **Remove ytdl-core** - Delete the dependency entirely
2. **Add yt-dlp binary** - Bundle yt-dlp executable with the Electron app
3. **Spawn yt-dlp as child process** - Use Node's `child_process` to run yt-dlp commands
4. **Parse yt-dlp output** - Get video info via `--dump-json`, track download progress via stdout

### Binary Bundling

Bundle yt-dlp binaries with the app for each platform:
- `bin/yt-dlp` - macOS/Linux
- `bin/yt-dlp.exe` - Windows

Binaries sourced from: https://github.com/yt-dlp/yt-dlp/releases

## API Changes

### POST /api/download (MP4)

```bash
yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" \
  --merge-output-format mp4 \
  -o "path/to/videos/%(title)s/%(title)s.%(ext)s" \
  --write-thumbnail \
  --progress \
  "URL"
```

### POST /api/download-mp3 (Audio)

```bash
yt-dlp -x --audio-format mp3 --audio-quality 128K \
  -o "path/to/musics/%(title)s/%(title)s.%(ext)s" \
  --write-thumbnail \
  --progress \
  "URL"
```

### POST /api/info (Metadata)

```bash
yt-dlp --dump-json "URL"
```

Returns JSON with title, thumbnail, duration, formats, etc.

### Progress Tracking

Parse yt-dlp stdout output: `[download]  45.2% of 50.00MiB at 2.50MiB/s`

## yt-dlp Helper Module

New file: `src-electron/main-process/server/modules/ytdlp.js`

```javascript
const { spawn } = require('child_process');
const path = require('path');

function getBinaryPath() {
  const platform = process.platform;
  const binName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';

  const basePath = app.isPackaged
    ? path.join(process.resourcesPath, 'bin')
    : path.join(__dirname, '../../../../bin');

  return path.join(basePath, binName);
}

// Exports:
// - getInfo(url) → Promise<{title, thumbnail, duration, ...}>
// - downloadVideo(url, outputDir, onProgress) → Promise<filepath>
// - downloadAudio(url, outputDir, onProgress) → Promise<filepath>
```

## Error Handling

| Error | Detection | User Message |
|-------|-----------|--------------|
| Video unavailable | "Video unavailable" in stderr | "This video is private or deleted" |
| Age restricted | "Sign in to confirm your age" | "Age-restricted video, cannot download" |
| Region blocked | "not available in your country" | "Video not available in your region" |
| Invalid URL | "is not a valid URL" | "Invalid YouTube URL" |
| Network error | Connection/timeout errors | "Network error, please try again" |

Additional handling:
- 10-minute timeout for downloads
- Delete partial files on failure

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src-electron/main-process/server/modules/ytdlp.js` | Create | New yt-dlp wrapper module |
| `src-electron/main-process/server/server.js` | Modify | Replace ytdl-core calls with ytdlp module |
| `package.json` | Modify | Remove `ytdl-core` dependency |
| `quasar.config.js` | Modify | Add `extraResources` for yt-dlp binaries |
| `bin/yt-dlp` | Add | macOS/Linux binary |
| `bin/yt-dlp.exe` | Add | Windows binary |

## Dependencies

**Remove:**
- `ytdl-core`

**Keep:**
- `fluent-ffmpeg` (optional, yt-dlp handles MP3 conversion)

## Notes

- No frontend changes required - API interface remains the same
- yt-dlp natively handles YouTube Shorts URLs
- FFmpeg is still required for format merging (user must have it installed, or bundle it)
