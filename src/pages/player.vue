<template>
  <q-page class="flex flex-center">
    <video-player :src="`statics/${src}`" :img="`statics/${img}`">
    </video-player>
  </q-page>
</template>

<script>
import videoPlayer from './../components/videoPlayer'
export default {
  name: 'Player',
  components: {
    videoPlayer
  },
  data () {
    return {
      src: '',
      img: ''
    }
  },
  mounted () {
    this.src = this.$route.params.src
    this.img = this.$route.params.img
  }
}
</script>

<style>
</style>
