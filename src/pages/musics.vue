<template>
  <q-page>
    <q-page-container>
      <q-ajax-bar ref="bar"/>
      <div class="row" v-if="checkDatabase">
        <div class="col-md-3 row justify-center q-mb-md" :key="index" v-for="(info, index) of infos">
          <q-card inline class="col-md-10" color="purple">
            <q-card-media>
              <img :src="`${appFolder}${info.thumbnail}`">
            </q-card-media>
            <q-card-title class="relative-position">
              <div class="ellipsis q-caption" :title="info.title">
                <q-tooltip>{{info.title}}</q-tooltip>
                {{info.title}}
              </div>
              <div slot="right" class="row items-center">
                <q-icon name="remove_red_eye" />
              </div>
            </q-card-title>
            <q-card-separator />
            <q-card-actions>
              <q-btn @click="goTo(info)">
                <q-icon class="q-mr-sm" name="play_circle_filled">
                </q-icon>
                PLAY
              </q-btn>
            </q-card-actions>
          </q-card>
        </div>
      </div>
      <div class="row" v-else>
        <div class="col-md-12 row justify-center q-mb-md">
          <q-card inline class="col-md-10" color="purple">
            <h2>Don't find any musics in your app!!</h2>
          </q-card>
        </div>
      </div>
    </q-page-container>
  </q-page>
</template>

<script>
export default {
  name: 'Musics',
  data () {
    return {
      infos: [],
      checkDatabase: false,
      appFolder: ''
    }
  },
  async created () {
    if (window.electronAPI) {
      this.appFolder = await window.electronAPI.getFolderApp()
    }
  },
  mounted () {
    this.listVideos()
  },
  methods: {
    async listVideos () {
      this.$refs.bar.start()
      try {
        if (window.electronAPI) {
          const data = await window.electronAPI.getDownloads()
          this.infos = data.musics || []
          this.checkDatabase = this.infos.length > 0
        }
      } catch (err) {
        console.error('Failed to load musics:', err)
      } finally {
        this.$refs.bar.stop()
      }
    },
    goTo (info) {
      this.videoSelect(info)
      this.$router.push({ name: 'player', params: { src: info.src, img: info.thumbnail } })
    },
    videoSelect (info) {
      window.localStorage.setItem('media', JSON.stringify(info))
    }
  }
}
</script>

<style>
</style>
