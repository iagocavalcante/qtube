<template>
  <q-page class="flex flex-center">
    <video-player :src="src" :img="img">
    </video-player>
  </q-page>
</template>

<script>
import videoPlayer from './../components/videoPlayer'
import { ipcRenderer } from 'electron'

export default {
  name: 'Player',
  components: {
    videoPlayer
  },
  data () {
    return {
      src: '',
      img: '',
      videosFolder: ipcRenderer.sendSync('getFolderApp')
    }
  },
  mounted () {
    console.log(ipcRenderer.sendSync('getFolderApp'))
    this.src = `${this.videosFolder}/${this.$route.params.src}`
    this.img = `${this.videosFolder}/${this.$route.params.img}`
    console.log(this.src)
  }
}
</script>

<style>
</style>
