<template>
  <div class="video-player-container">
    <div v-if="error" class="error-state flex flex-center column q-pa-xl">
      <q-icon name="error_outline" size="64px" color="negative" />
      <div class="text-h6 q-mt-md">Failed to load media</div>
      <div class="text-body2 text-grey q-mt-sm">{{ error }}</div>
    </div>
    <video
      v-else
      ref="videoPlayer"
      class="video-js vjs-default-skin vjs-big-play-centered"
      controls
      preload="auto"
    >
      <p class="vjs-no-js">
        To view this video please enable JavaScript.
      </p>
    </video>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

export default {
  name: 'VideoPlayer',
  props: {
    src: {
      type: String,
      required: true
    },
    img: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const videoPlayer = ref(null)
    const error = ref(null)
    let player = null

    const getMediaType = (src) => {
      if (!src) return 'video/mp4'
      if (src.endsWith('.mp3')) return 'audio/mpeg'
      if (src.endsWith('.mp4')) return 'video/mp4'
      if (src.endsWith('.webm')) return 'video/webm'
      return 'video/mp4'
    }

    const initializePlayer = async () => {
      try {
        // Wait for DOM to be ready
        await nextTick()

        if (!videoPlayer.value) {
          console.error('Video element not found')
          return
        }

        if (player) {
          console.log('Player already initialized')
          return
        }

        console.log('Initializing player with src:', props.src)

        const mediaType = getMediaType(props.src)
        const isAudio = mediaType.startsWith('audio')

        player = videojs(videoPlayer.value, {
          height: isAudio ? 80 : 480,
          width: 853,
          controls: true,
          preload: 'auto',
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          responsive: true,
          fluid: !isAudio,
          sources: [{
            src: props.src,
            type: mediaType
          }],
          poster: isAudio ? '' : props.img
        })

        player.ready(() => {
          console.log('Video player is ready')
        })

        player.on('error', (e) => {
          const err = player.error()
          console.error('Video player error:', err)
          error.value = err?.message || 'Unknown playback error'
        })

      } catch (err) {
        console.error('Failed to initialize player:', err)
        error.value = err.message || 'Failed to initialize player'
      }
    }

    const updateSource = () => {
      if (player && props.src) {
        const mediaType = getMediaType(props.src)
        player.src({
          src: props.src,
          type: mediaType
        })

        if (props.img && !mediaType.startsWith('audio')) {
          player.poster(props.img)
        }
      }
    }

    onMounted(() => {
      initializePlayer()
    })

    onUnmounted(() => {
      if (player) {
        try {
          player.dispose()
        } catch (err) {
          console.error('Error disposing player:', err)
        }
        player = null
      }
    })

    // Watch for prop changes
    watch(() => props.src, updateSource)
    watch(() => props.img, updateSource)

    return {
      videoPlayer,
      error
    }
  }
}
</script>

<style scoped>
.video-player-container {
  width: 100%;
  max-width: 853px;
  margin: 0 auto;
}

.video-js {
  width: 100%;
  height: auto;
}

.error-state {
  background: #f5f5f5;
  border-radius: 8px;
  min-height: 300px;
}
</style>
