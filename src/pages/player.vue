<template>
  <q-page class="flex flex-center">
    <video-player :src="src" :img="img">
    </video-player>
  </q-page>
</template>

<script>
import videoPlayer from '../components/videoPlayer.vue'

export default {
  name: 'VideoPlayer',
  components: {
    videoPlayer
  },
  data () {
    return {
      src: '',
      img: '',
      videosFolder: ''
    }
  },
  async mounted () {
    // Get videos folder through secure IPC API
    if (window.electronAPI) {
      this.videosFolder = await window.electronAPI.getFolderApp?.() || ''
    }
    
    this.src = this.$route.params.src ? `${this.videosFolder}/${this.$route.params.src}` : this.$route.params.src
    this.img = this.$route.params.img ? `${this.videosFolder}/${this.$route.params.img}` : this.$route.params.img
    
    console.log('Video source:', this.src)
    console.log('Video poster:', this.img)
  }
}
</script>

<style>
</style>
