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
        @click="download()"
      >
        <span slot="loading">
          <q-spinner-hourglass class="on-left" />
        </span>
      </q-btn>
    </div>
    <q-btn-dropdown  icon="build" class="on-right round" color="purple">
      <q-list link>
        <q-item :key="index" v-for="(option, index) of options" @click.native="chooseType(option)">
          <q-item-side icon="settings" inverted color="purple" />
          <q-item-main>
            <q-item-tile :class="selectedType.type === option.type ? 'bold' : ''" label>{{option.type}}</q-item-tile>
          </q-item-main>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </q-page>
</template>

<style>
.bold {
  font-weight: bold;
}
</style>

<script>
export default {
  name: 'PageIndex',
  data () {
    return {
      youtubeUrl: '',
      isDisable: false,
      options: [
        {
          type: 'mp3',
          download: () => this.donwloadMp3()
        },
        {
          type: 'mp4',
          download: () => this.donwloadVideo()
        },
        {
          type: 'playlist',
          download: () => this.donwloadPlaylist()
        }
      ],
      selectedType: {
        type: 'mp3',
        download: () => this.donwloadMp3()
      }
    }
  },
  methods: {
    download () {
      this.selectedType.download()
    },
    donwloadMp3 () {
      this.isDisable = true
      this.$refs.bar.start()

      this.$axios.post('http://localhost:3000/api/download-mp3', { youtubeUrl: this.youtubeUrl })
        .then(data => {
          this.statusDefault()
          console.log(data)
        })
        .catch(err => {
          this.statusDefault()
          console.log(err)
        })
    },
    donwloadVideo () {
      this.isDisable = true
      this.$refs.bar.start()

      this.$axios.post('http://localhost:3000/api/download', { youtubeUrl: this.youtubeUrl })
        .then(data => {
          this.statusDefault()
          console.log(data)
        })
        .catch(err => {
          this.statusDefault()
          console.log(err)
        })
    },
    donwloadPlaylist () {
      this.isDisable = true
      this.$refs.bar.start()

      this.$axios.post('http://localhost:3000/api/download-playlist', { youtubeUrl: this.youtubeUrl })
        .then(data => {
          this.statusDefault()
          console.log(data)
        })
        .catch(err => {
          this.statusDefault()
          console.log(err)
        })
    },
    chooseType (option) {
      this.selectedType.type = option.type
      this.selectedType.download = option.download
    },
    statusDefault () {
      this.isDisable = false
      this.youtubeUrl = ''
      this.$refs.bar.stop()
    }
  }
}
</script>
