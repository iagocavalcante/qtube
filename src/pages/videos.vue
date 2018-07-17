<template>
  <q-page>
    <q-page-container>
      <q-ajax-bar ref="bar"/>
      <div class="row">
        <div class="col-md-3 row justify-center q-mb-md" :key="index" v-for="(info, index) of infos">
          <q-card inline class="col-md-10" color="purple">
            <q-card-media>
              <img :src="`statics/${info.thumbnail}`">
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
              <q-btn flat color="white">
                <q-icon class="q-mr-sm" name="play_circle_filled">
                </q-icon>
                VIEW</q-btn>
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </q-page-container>
  </q-page>
</template>

<script>
export default {
  name: 'VideoPage',
  data () {
    return {
      infos: []
    }
  },
  mounted () {
    this.listVideos()
  },
  methods: {
    listVideos () {
      this.$refs.bar.start()
      this.$axios.get('http://localhost:3000/api/infos')
        .then(data => {
          this.infos = data.data.ytdown
          console.log(this.infos)
          this.$refs.bar.stop()
        })
        .catch(err => {
          this.$refs.bar.stop()
          console.log(err)
        })
    }
  }
}
</script>

<style>
</style>
