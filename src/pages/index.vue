<template>
  <q-page class="flex flex-center row">
    <q-field
      class="col-8"
    >
      <q-input 
        v-model="youtubeUrl" 
        color="purple" 
        label="Video URL" 
        required
        outlined
      >
        <template v-slot:prepend>
          <q-icon name="ondemand_video" color="purple" />
        </template>
      </q-input>
    </q-field>
    <q-ajax-bar ref="bar" position="bottom" color="purple" size="18px"/>
    <div class="flex flex-center q-pa-sm">
      <q-btn
        class="col-5"
        color="purple"
        size="lg"
        label="Download"
        :loading="isDownloading"
        :disable="!youtubeUrl || isDownloading"
        @click="download()"
      >
        <template v-slot:loading>
          <q-spinner-hourglass class="on-left" />
          Downloading...
        </template>
      </q-btn>
    </div>
    <q-btn-dropdown icon="build" class="on-right round" color="purple">
      <q-list>
        <q-item 
          v-for="(option, index) of options" 
          :key="index" 
          clickable 
          @click="chooseType(option)"
        >
          <q-item-section avatar>
            <q-icon name="settings" color="purple" />
          </q-item-section>
          <q-item-section>
            <q-item-label :class="selectedType.type === option.type ? 'text-weight-bold' : ''">
              {{ option.type }}
            </q-item-label>
          </q-item-section>
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
  name: 'IndexPage',
  data () {
    return {
      youtubeUrl: '',
      isDownloading: false, // Fixed: renamed from isDisable and explicitly set to false
      options: [
        {
          type: 'mp3',
          download: () => this.downloadMp3()
        },
        {
          type: 'mp4', 
          download: () => this.downloadVideo()
        }
      ],
      selectedType: {
        type: 'mp3',
        download: () => this.downloadMp3()
      }
    }
  },
  methods: {
    download () {
      if (!this.youtubeUrl || this.isDownloading) {
        return
      }
      this.selectedType.download()
    },
    downloadMp3 () {
      this.isDownloading = true
      this.$refs.bar.start()

      this.$axios.post('http://localhost:3000/api/download-mp3', { youtubeUrl: this.youtubeUrl })
        .then(data => {
          this.resetToDefault()
          console.log('MP3 download completed:', data)
          this.$q.notify({
            type: 'positive',
            message: 'MP3 download completed successfully!'
          })
        })
        .catch(err => {
          this.resetToDefault()
          console.error('MP3 download failed:', err)
          this.$q.notify({
            type: 'negative', 
            message: 'Download failed. Please check the URL and try again.'
          })
        })
    },
    downloadVideo () {
      this.isDownloading = true
      this.$refs.bar.start()

      this.$axios.post('http://localhost:3000/api/download', { youtubeUrl: this.youtubeUrl })
        .then(data => {
          this.resetToDefault()
          console.log('Video download completed:', data)
          this.$q.notify({
            type: 'positive',
            message: 'Video download completed successfully!'
          })
        })
        .catch(err => {
          this.resetToDefault()
          console.error('Video download failed:', err)
          this.$q.notify({
            type: 'negative',
            message: 'Download failed. Please check the URL and try again.'
          })
        })
    },
    chooseType (option) {
      this.selectedType.type = option.type
      this.selectedType.download = option.download
    },
    resetToDefault () {
      this.isDownloading = false // Fixed: renamed from isDisable
      this.youtubeUrl = ''
      this.$refs.bar.stop()
    }
  }
}
</script>
