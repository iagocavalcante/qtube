<template>
  <q-page class="q-pa-md">
    <div v-if="loading" class="text-center q-mt-xl">
      <q-spinner color="primary" size="50px" />
      <div class="q-mt-sm text-grey">Loading player...</div>
    </div>

    <div v-else-if="!src" class="text-center q-mt-xl">
      <q-icon name="error" size="50px" color="grey" />
      <div class="q-mt-sm text-grey">No media selected</div>
      <q-btn
        color="primary"
        label="Go to Videos"
        class="q-mt-md"
        @click="$router.push('/videos')"
      />
    </div>

    <div v-else class="video-wrapper">
      <div class="text-h6 q-mb-md">{{ title }}</div>

      <!-- Simple HTML5 video player (no Video.js) -->
      <video
        ref="videoElement"
        :src="src"
        :poster="img"
        controls
        class="full-width"
        style="max-height: 70vh; background: #000;"
        @error="onVideoError"
      >
        Your browser does not support the video tag.
      </video>

      <div v-if="videoError" class="text-negative q-mt-md">
        Error: {{ videoError }}
      </div>

      <div class="q-mt-md">
        <q-btn
          flat
          color="primary"
          icon="arrow_back"
          label="Back to Videos"
          @click="$router.push('/videos')"
        />
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'PlayerPage',
  data () {
    return {
      src: '',
      img: '',
      title: '',
      loading: true,
      videoError: null
    }
  },
  async mounted () {
    console.log('Player mounted')
    try {
      let appFolder = ''

      // Get app folder
      if (window.electronAPI) {
        appFolder = await window.electronAPI.getFolderApp() || ''
        console.log('App folder:', appFolder)
      }

      // Get media from localStorage
      const stored = window.localStorage.getItem('media')
      console.log('Stored media:', stored)

      if (stored) {
        const media = JSON.parse(stored)
        console.log('Parsed media:', media)

        this.title = media.title || 'Unknown'
        this.src = `file://${appFolder}${media.src}`
        this.img = media.thumbnail ? `file://${appFolder}${media.thumbnail}` : ''

        console.log('Video src:', this.src)
        console.log('Video img:', this.img)
      }
    } catch (err) {
      console.error('Error in player mounted:', err)
      this.videoError = err.message
    } finally {
      this.loading = false
    }
  },
  methods: {
    onVideoError (e) {
      console.error('Video error event:', e)
      const video = this.$refs.videoElement
      if (video && video.error) {
        this.videoError = `Code ${video.error.code}: ${video.error.message || 'Unknown error'}`
      } else {
        this.videoError = 'Failed to load video'
      }
    }
  }
}
</script>

<style scoped>
.video-wrapper {
  max-width: 900px;
  margin: 0 auto;
}
</style>
