<template>
  <q-page class="flex flex-center row">
    <q-field
      icon="ondemand_video"
      icon-color="purple"
      class="col-8"
    >
      <q-input inverted v-model="youtubeUrl" color="purple" stack-label="Video URL" required/>
    </q-field>
    <q-ajax-bar ref="bar" :position="'bottom'" color="purple" :size="'18px'"/>
    <div class="flex flex-center q-pa-sm">
      <q-btn
        class="col-5"
        color="purple"
        size="lg"
        label="Download"
        :loading="isDisable"
        @click="downloadVideo()"
      >
        <span slot="loading">
          <q-spinner-hourglass class="on-left" />
        </span>
      </q-btn>
    </div>
    <q-btn-dropdown  icon="build" class="on-right round" color="purple">
      <q-list link>
        <q-item>
          <q-item-side icon="settings" inverted color="purple" />
          <q-item-main>
            <q-item-tile label>720p</q-item-tile>
          </q-item-main>
        </q-item>
        <q-item>
          <q-item-side icon="settings" inverted color="purple" />
          <q-item-main>
            <q-item-tile label style="font-weight: bold;">420p</q-item-tile>
          </q-item-main>
        </q-item>
        <q-item>
          <q-item-side icon="settings" inverted color="purple" />
          <q-item-main>
            <q-item-tile label>144p</q-item-tile>
          </q-item-main>
        </q-item>
      </q-list>
      </q-btn-dropdown>
  </q-page>
</template>

<style>
</style>

<script>
export default {
  name: 'PageIndex',
  data () {
    return {
      youtubeUrl: '',
      isDisable: false
    }
  },
  methods: {
    downloadVideo () {
      this.isDisable = true
      this.$refs.bar.start()
      this.$axios.post('http://localhost:3000/api/download', { youtubeUrl: this.youtubeUrl })
        .then(data => {
          this.isDisable = false
          this.youtubeUrl = ''
          this.$refs.bar.stop()
          console.log(data)
        })
        .catch(err => {
          this.isDisable = false
          this.youtubeUrl = ''
          this.$refs.bar.stop()
          console.log(err)
        })
    }
  }
}
</script>
