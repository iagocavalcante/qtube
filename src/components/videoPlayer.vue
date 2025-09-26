<template>
  <div class="video-player-container">
    <video
      ref="videoPlayer"
      class="video-js vjs-default-skin"
      :poster="img"
      controls
      preload="auto"
      width="853"
      height="480"
      data-setup="{}"
    >
      <source :src="src" type="video/mp4" />
      <p class="vjs-no-js">
        To view this video please enable JavaScript, and consider upgrading to a web browser that
        <a href="https://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>.
      </p>
    </video>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
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
    let player = null

    const initializePlayer = () => {
      if (videoPlayer.value && !player) {
        player = videojs(videoPlayer.value, {
          height: 480,
          width: 853,
          controls: true,
          preload: 'auto',
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          responsive: true,
          fluid: true,
          sources: [{
            src: props.src,
            type: 'video/mp4'
          }],
          poster: props.img
        })

        player.ready(() => {
          console.log('Video player is ready')
        })

        player.on('play', () => {
          console.log('Video started playing')
        })

        player.on('pause', () => {
          console.log('Video paused')
        })
      }
    }

    const updateSource = () => {
      if (player && props.src) {
        player.src({
          src: props.src,
          type: 'video/mp4'
        })
        
        if (props.img) {
          player.poster(props.img)
        }
      }
    }

    onMounted(() => {
      initializePlayer()
    })

    onUnmounted(() => {
      if (player) {
        player.dispose()
        player = null
      }
    })

    // Watch for prop changes
    watch(() => props.src, updateSource)
    watch(() => props.img, updateSource)

    return {
      videoPlayer
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

.video-js .vjs-big-play-button {
  font-size: 2em;
  line-height: 2;
  height: 2em;
  width: 2em;
  border-radius: 50%;
  background-color: rgba(43, 51, 63, 0.7);
  border: 0.06666em solid #fff;
  margin: -1em 0 0 -1em;
}
</style>
