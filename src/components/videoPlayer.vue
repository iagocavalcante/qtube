<template>
  <!-- <video-player class="video-player-box"
    ref="videoPlayer"
    :options="playerOptions"
    :playsinline="true"
    @ready="playerIsReady"
    @changed="playerStateChanged($event)">
  </video-player> -->
  <q-video
    :src="src"
    style="width: 853px; height: 480px"
  />
</template>

<script>
import 'video.js/dist/video-js.css'

import { videoPlayer } from 'vue-video-player'

export default {
  name: 'VideoPlayer',
  components: {
    videoPlayer
  },
  props: {
    src: {
      type: String
    },
    img: {
      type: String
    }
  },
  computed: {
    player () {
      return this.$refs.videoPlayer.player
    }
  },
  data () {
    return {
      playerOptions: {
        height: '500',
        // videojs options
        muted: false,
        language: 'en',
        playbackRates: [0.7, 1.0, 1.5, 2.0],
        sources: [{
          type: 'video/mp4',
          src: ''
        }],
        poster: ''
      }
    }
  },
  methods: {
    playerStateChanged (playerCurrentState) {
      console.log('example 2: state changed', playerCurrentState)
    },
    playerIsReady (player) {
      this.playerOptions.sources[0].src = this.$props.src
      this.playerOptions.poster = this.$props.img
    }
  }
}
</script>

<style>
</style>
