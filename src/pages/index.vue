<template>
  <q-page class="flex flex-center column q-pa-md" style="width: 100%;">
    <q-input
      ref="urlInput"
      v-model="youtubeUrl"
      color="primary"
      label="Video URL"
      required
      outlined
      class="full-width q-mb-md"
      :error="showValidationError"
      :error-message="validationMessage"
      placeholder="Paste YouTube URL here..."
      autofocus
      @update:model-value="onUrlChange"
      @keyup.enter="download"
    >
      <template v-slot:prepend>
        <q-icon name="ondemand_video" color="primary" />
      </template>
      <template v-slot:append>
        <q-icon
          v-if="youtubeUrl"
          name="clear"
          class="cursor-pointer"
          @click="clearInput"
        />
      </template>
      <template v-slot:hint>
        <span class="text-grey-6">
          Supports: youtube.com, youtu.be, shorts, and playlists
        </span>
      </template>
      <template v-slot:after>
        <q-btn
          round
          flat
          icon="content_paste"
          color="primary"
          @click="pasteFromClipboard"
        >
          <q-tooltip>Paste from clipboard</q-tooltip>
        </q-btn>
      </template>
    </q-input>
    <q-linear-progress
      v-if="isDownloading"
      :value="downloadPercent / 100"
      color="primary"
      class="full-width q-mb-md"
      size="20px"
      stripe
      rounded
    >
      <div class="absolute-full flex flex-center">
        <q-badge color="white" text-color="primary" :label="`${Math.round(downloadPercent)}%`" />
      </div>
    </q-linear-progress>
    <div v-if="isDownloading && downloadStatus" class="text-caption q-mb-md text-grey-7">
      {{ downloadStatus }}
    </div>
    <div class="flex q-gutter-sm">
      <q-btn
        color="primary"
        size="lg"
        label="Download"
        :loading="isDownloading"
        :disable="!isValidUrl || isDownloading"
        @click="download()"
      >
        <template v-slot:loading>
          <q-spinner-hourglass class="on-left" />
          Downloading...
        </template>
      </q-btn>
      <q-btn-dropdown icon="build" color="primary">
      <q-list>
        <q-item
          v-for="(option, index) of options"
          :key="index"
          clickable
          @click="chooseType(option)"
        >
          <q-item-section avatar>
            <q-icon name="settings" color="primary" />
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
// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,      // youtube.com/watch?v=xxx
  /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,       // youtube.com/shorts/xxx
  /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=[\w-]+/, // youtube.com/playlist?list=xxx
  /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,        // youtube.com/embed/xxx
  /^(https?:\/\/)?(www\.)?youtube\.com\/v\/[\w-]+/,            // youtube.com/v/xxx
  /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,                  // youtu.be/xxx
  /^(https?:\/\/)?(www\.)?youtube\.com\/live\/[\w-]+/,         // youtube.com/live/xxx
  /^(https?:\/\/)?(music\.)?youtube\.com\/watch\?v=[\w-]+/     // music.youtube.com/watch?v=xxx
]

export default {
  name: 'IndexPage',
  data () {
    return {
      youtubeUrl: '',
      isDownloading: false,
      downloadPercent: 0,
      downloadStatus: '',
      hasInteracted: false,
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
  computed: {
    isValidUrl () {
      if (!this.youtubeUrl || !this.youtubeUrl.trim()) {
        return false
      }
      const url = this.youtubeUrl.trim()
      return YOUTUBE_PATTERNS.some(pattern => pattern.test(url))
    },
    showValidationError () {
      return this.hasInteracted && this.youtubeUrl && !this.isValidUrl
    },
    validationMessage () {
      if (!this.youtubeUrl) {
        return ''
      }
      if (!this.youtubeUrl.includes('youtube') && !this.youtubeUrl.includes('youtu.be')) {
        return 'Please enter a YouTube URL'
      }
      if (!this.isValidUrl) {
        return 'Invalid YouTube URL format'
      }
      return ''
    }
  },
  mounted () {
    this.setupProgressListener()
  },
  beforeUnmount () {
    this.removeProgressListener()
  },
  methods: {
    onUrlChange () {
      this.hasInteracted = true
    },
    async pasteFromClipboard () {
      try {
        const text = await navigator.clipboard.readText()
        if (text) {
          this.youtubeUrl = text
          this.hasInteracted = true
        }
      } catch (err) {
        console.error('Failed to paste:', err)
        this.$q.notify({
          type: 'negative',
          message: 'Failed to read clipboard'
        })
      }
    },
    clearInput () {
      this.youtubeUrl = ''
      this.hasInteracted = false
      this.$refs.urlInput?.focus()
    },
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
      if (!this.isValidUrl || this.isDownloading) {
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
        const result = await window.electronAPI.downloadAudio(this.youtubeUrl.trim())
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
        const result = await window.electronAPI.downloadVideo(this.youtubeUrl.trim())
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
      this.hasInteracted = false
    }
  }
}
</script>
