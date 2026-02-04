# QTube

YouTube video/audio downloader built with Quasar (Vue 3) + Electron + yt-dlp.

## Quick Start

```bash
npm install
npm run dev    # Development with hot reload
npm run build  # Production build
```

## Stack

- **Frontend**: Vue 3 + Quasar Framework
- **Desktop**: Electron 40
- **Backend**: Express server (port 52847)
- **Downloads**: yt-dlp + ffmpeg (bundled binaries)
- **Player**: Video.js

## Architecture

```
Renderer (Vue) ──HTTP──> Express ──spawn──> yt-dlp
       │                    │
       └──IPC──> Main ──────┴──> File System
```

- **Main Process**: Window management, IPC handlers, auto-updates
- **Preload**: Context bridge (`window.electronAPI`)
- **Express**: REST API for download operations
- **yt-dlp**: Handles YouTube extraction and conversion

## Key Files

| File | Purpose |
|------|---------|
| `src-electron/electron-main.js` | Entry point, IPC, auto-update |
| `src-electron/electron-preload.js` | Context bridge API |
| `src-electron/main-process/server/server.js` | Express REST API |
| `src-electron/main-process/server/modules/ytdlp/index.js` | yt-dlp wrapper |
| `src/layouts/default.vue` | Navigation, window controls |
| `src/pages/index.vue` | Download form |

## Important Patterns

1. **IPC Communication**: Use `ipcMain.handle()` + `ipcRenderer.invoke()` (not `on`/`send`)
2. **Router Mode**: Must be `hash` (not `history`) for Electron
3. **Context Isolation**: Access Node.js only via `window.electronAPI`
4. **Binary Paths**: Different in dev vs prod (`cwd/bin` vs `resourcesPath/bin`)

## Downloads Location

```
~/Downloads/Ytdown/
├── database/ytdown.json
├── videos/{title}/{title}.mp4
└── musics/{title}/{title}.mp3
```

For detailed architecture, see [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md).
