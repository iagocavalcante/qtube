<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-tabs color="primary">
        <q-route-tab to="/index" icon="get_app" replace label="Download" />
        <q-route-tab to="/videos" icon="perm_media" replace label="Videos" />
        <q-route-tab to="/musics" icon="queue_music" replace label="Musics" />
        <q-route-tab to="/player" icon="theaters" replace label="Player" />
        <q-tab class="updates" :count="updatesAvailable" @click="update()" icon="settings" replace label="Updates" />
        <q-tab class="minimize" @click="minimizeApp()" icon="minimize" replace label="Minimize" />
        <q-tab class="absolute-right" @click="closeApp()" icon="power_settings_new" replace label="Poweroff" />
      </q-tabs>

      <!-- Global Download Progress Bar -->
      <q-linear-progress
        v-if="downloading"
        :value="downloadProgress / 100"
        color="accent"
        class="download-progress"
        size="4px"
      />
    </q-header>

    <!-- Download Status Banner -->
    <q-banner
      v-if="downloading"
      class="download-banner bg-primary text-white"
      dense
    >
      <template v-slot:avatar>
        <q-spinner-dots color="white" size="24px" />
      </template>
      <div class="row items-center">
        <div class="col">
          <strong>Downloading:</strong> {{ downloadTitle }}
          <span class="q-ml-md text-caption">
            {{ downloadProgress.toFixed(0) }}%
            <span v-if="downloadSpeed"> · {{ downloadSpeed }}</span>
            <span v-if="downloadEta"> · ETA: {{ downloadEta }}</span>
          </span>
        </div>
        <div class="col-auto">
          <q-btn
            flat
            dense
            icon="close"
            color="white"
            size="sm"
            @click="dismissDownload"
          />
        </div>
      </div>
    </q-banner>

    <q-page-container class="background">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'LayoutDefault',
  data () {
    return {
      updatesAvailable: null,
      // Download state
      downloading: false,
      downloadProgress: 0,
      downloadTitle: '',
      downloadSpeed: '',
      downloadEta: '',
      downloadDismissed: false
    }
  },
  mounted () {
    this.initialize()
    this.setupDownloadListener()
    setTimeout(() => {
      this.checkUpdates()
    }, 1000)
  },
  unmounted () {
    // Clean up event listeners
    if (window.electronAPI) {
      window.electronAPI.removeUpdateListener()
      window.electronAPI.removeDownloadProgressListener()
    }
  },
  methods: {
    closeApp () {
      if (window.electronAPI) {
        window.electronAPI.closeApp()
      }
    },
    minimizeApp () {
      if (window.electronAPI) {
        window.electronAPI.minimize()
      }
    },
    async initialize () {
      if (window.electronAPI) {
        await window.electronAPI.createYtDownFolder()
        await window.electronAPI.createVideosFolder()
        await window.electronAPI.createMusicFolder()
        await window.electronAPI.createDatabaseFolder()
        await window.electronAPI.createFileDatabase()
      }
    },
    setupDownloadListener () {
      if (window.electronAPI) {
        window.electronAPI.onDownloadProgress((progress) => {
          console.log('Layout received progress:', progress)

          if (progress.stage === 'starting') {
            this.downloading = true
            this.downloadDismissed = false
            this.downloadProgress = 0
            this.downloadTitle = progress.title || 'Unknown'
            this.downloadSpeed = ''
            this.downloadEta = ''
          } else if (progress.stage === 'downloading') {
            this.downloading = true
            this.downloadProgress = progress.percent || 0
            this.downloadTitle = progress.title || this.downloadTitle
            this.downloadSpeed = progress.speed || ''
            this.downloadEta = progress.eta || ''
          } else if (progress.stage === 'complete') {
            this.downloadProgress = 100
            this.$q.notify({
              type: 'positive',
              message: `Download complete: ${progress.title || this.downloadTitle}`,
              timeout: 5000
            })
            // Hide after a delay
            setTimeout(() => {
              if (!this.downloadDismissed) {
                this.downloading = false
              }
            }, 2000)
          } else if (progress.stage === 'error') {
            this.downloading = false
            this.$q.notify({
              type: 'negative',
              message: `Download failed: ${progress.error || 'Unknown error'}`,
              timeout: 5000
            })
          }
        })
      }
    },
    dismissDownload () {
      this.downloadDismissed = true
      this.downloading = false
    },
    checkUpdates () {
      if (window.electronAPI) {
        window.electronAPI.onUpdateReady((info) => {
          this.updatesAvailable = '1'
          this.$q.notify({
            type: 'info',
            message: `Update v${info?.version || 'new'} is ready! Click Updates to install.`,
            timeout: 10000
          })
        })
      }
    },
    update () {
      if (window.electronAPI) {
        window.electronAPI.quitAndInstall()
      }
    }
  }
}
</script>

<style>
::-webkit-scrollbar {
  display: none;
}

.minimize {
  margin-left: 0em;
}

.updates {
  margin-left: 12em;
}

.background {
  background: #fff url(../statics/darkrola.jpeg);
  height: 100%;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.download-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.download-banner {
  position: sticky;
  top: 0;
  z-index: 100;
}
</style>
