<template>
  <q-page class="flex flex-center column q-pa-md" style="width: 100%;">
    <q-input
      v-model="youtubeUrl"
      color="purple"
      label="Video URL"
      required
      outlined
      class="full-width q-mb-md"
    >
      <template v-slot:prepend>
        <q-icon name="ondemand_video" color="purple" />
      </template>
    </q-input>
    <q-linear-progress
      v-if="isDownloading"
      :value="downloadPercent / 100"
      color="purple"
      class="full-width q-mb-md"
      size="20px"
      stripe
      rounded
    >
      <div class="absolute-full flex flex-center">
        <q-badge color="white" text-color="purple" :label="`${Math.round(downloadPercent)}%`" />
      </div>
    </q-linear-progress>
    <div v-if="isDownloading && downloadStatus" class="text-caption q-mb-md text-grey-7">
      {{ downloadStatus }}
    </div>
    <div class="flex q-gutter-sm">
      <q-btn
        color="purple"
        size="lg"
        label="Download"
        :loading="isDownloading"
        :disable="!youtubeUrl || isDownloading"
        @click="download()"
      >
        <template v-slot:loading>
          <q-spinner-hourglass class="on-left" />
          Downloading...
        </template>
      </q-btn>
      <q-btn-dropdown icon="build" color="purple">
      <q-list>
        <q-item
          v-for="(option, index) of options"
          :key="index"
          clickable
          @click="chooseType(option)"
        >
          <q-item-section avatar>
            <q-icon name="settings" color="purple" />
          </q-item-section>
          <q-item-section>
            <q-item-label :class="selectedType.type === option.type ? 'text-weight-bold' : ''">
              {{ option.type }}
            </q-item-label>
          </q-item-section>
        </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>
  </q-page>
</template>

<style>
.bold {
  font-weight: bold;
}
</style>

<script>
export default {
  name: 'IndexPage',
  data () {
    return {
      youtubeUrl: '',
      isDownloading: false,
      downloadPercent: 0,
      downloadStatus: '',
      options: [
        {
          type: 'mp3',
          download: () => this.downloadMp3()
        },
        {
          type: 'mp4',
          download: () => this.downloadVideo()
        }
      ],
      selectedType: {
        type: 'mp3',
        download: () => this.downloadMp3()
      }
    }
  },
  mounted () {
    this.setupProgressListener()
  },
  beforeUnmount () {
    this.removeProgressListener()
  },
  methods: {
    setupProgressListener () {
      if (window.electronAPI) {
        window.electronAPI.onDownloadProgress((progress) => {
          this.downloadPercent = progress.percent || 0
          if (progress.stage === 'downloading') {
            this.downloadStatus = `Speed: ${progress.speed || 'N/A'} | ETA: ${progress.eta || 'N/A'}`
          } else if (progress.stage === 'starting') {
            this.downloadStatus = 'Starting download...'
          } else if (progress.stage === 'complete') {
            this.downloadStatus = 'Complete!'
          } else if (progress.stage === 'error') {
            this.downloadStatus = `Error: ${progress.error}`
          }
        })
      }
    },
    removeProgressListener () {
      if (window.electronAPI) {
        window.electronAPI.removeDownloadProgressListener()
      }
    },
    download () {
      if (!this.youtubeUrl || this.isDownloading) {
        return
      }
      this.selectedType.download()
    },
    async downloadMp3 () {
      if (!window.electronAPI) {
        this.$q.notify({
          type: 'negative',
          message: 'Electron API not available'
        })
        return
      }

      this.isDownloading = true
      this.downloadPercent = 0
      this.downloadStatus = 'Starting download...'

      try {
        const result = await window.electronAPI.downloadAudio(this.youtubeUrl)
        console.log('MP3 download completed:', result)
        this.$q.notify({
          type: 'positive',
          message: 'MP3 download completed successfully!'
        })
        this.resetToDefault()
      } catch (err) {
        console.error('MP3 download failed:', err)
        this.$q.notify({
          type: 'negative',
          message: err.message || 'Download failed. Please check the URL and try again.'
        })
        this.resetToDefault()
      }
    },
    async downloadVideo () {
      if (!window.electronAPI) {
        this.$q.notify({
          type: 'negative',
          message: 'Electron API not available'
        })
        return
      }

      this.isDownloading = true
      this.downloadPercent = 0
      this.downloadStatus = 'Starting download...'

      try {
        const result = await window.electronAPI.downloadVideo(this.youtubeUrl)
        console.log('Video download completed:', result)
        this.$q.notify({
          type: 'positive',
          message: 'Video download completed successfully!'
        })
        this.resetToDefault()
      } catch (err) {
        console.error('Video download failed:', err)
        this.$q.notify({
          type: 'negative',
          message: err.message || 'Download failed. Please check the URL and try again.'
        })
        this.resetToDefault()
      }
    },
    chooseType (option) {
      this.selectedType.type = option.type
      this.selectedType.download = option.download
    },
    resetToDefault () {
      this.isDownloading = false
      this.youtubeUrl = ''
      this.downloadPercent = 0
      this.downloadStatus = ''
    }
  }
}
</script>
