<template>
  <q-page class="q-pa-md">
    <q-ajax-bar ref="bar" color="accent" />

    <!-- Videos Grid -->
    <div v-if="checkDatabase" class="row q-col-gutter-md">
      <div
        v-for="(info, index) in infos"
        :key="index"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="video-card" flat bordered>
          <q-img
            :src="getThumbnailUrl(info.thumbnail)"
            :ratio="16/9"
            class="cursor-pointer"
            @click="goTo(info)"
          >
            <template v-slot:error>
              <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                <q-icon name="videocam_off" size="48px" />
              </div>
            </template>
            <div class="absolute-bottom-right q-pa-xs">
              <q-icon name="play_circle" size="32px" color="white" class="shadow-2" />
            </div>
          </q-img>

          <q-card-section class="q-pa-sm">
            <div class="text-subtitle2 ellipsis-2-lines" :title="info.title">
              {{ info.title }}
            </div>
          </q-card-section>

          <q-card-actions class="q-pt-none">
            <q-btn
              flat
              color="primary"
              icon="play_circle"
              label="Watch"
              @click="goTo(info)"
            />
            <q-space />
            <q-btn
              flat
              round
              color="grey"
              icon="folder_open"
              size="sm"
              @click="openFolder(info)"
            >
              <q-tooltip>Open folder</q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state flex flex-center column q-mt-xl">
      <q-icon name="video_library" size="80px" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">No videos yet</div>
      <div class="text-body2 text-grey-5">Download some videos to see them here</div>
      <q-btn
        color="primary"
        icon="download"
        label="Go to Download"
        class="q-mt-lg"
        @click="$router.push('/')"
      />
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'VideoPage',
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
    getThumbnailUrl (thumbnail) {
      if (!thumbnail || !this.appFolder) return ''
      return `file://${this.appFolder}${thumbnail}`
    },
    async listVideos () {
      this.$refs.bar.start()
      try {
        if (window.electronAPI) {
          const data = await window.electronAPI.getDownloads()
          this.infos = data.videos || []
          this.checkDatabase = this.infos.length > 0
        }
      } catch (err) {
        console.error('Failed to load videos:', err)
      } finally {
        this.$refs.bar.stop()
      }
    },
    goTo (info) {
      this.videoSelect(info)
      this.$router.push({ name: 'player' })
    },
    videoSelect (info) {
      window.localStorage.setItem('media', JSON.stringify(info))
    },
    openFolder (info) {
      if (window.electronAPI && window.electronAPI.openFolder) {
        const folder = `${this.appFolder}videos/${info.title}/`
        window.electronAPI.openFolder(folder)
      }
    }
  }
}
</script>

<style scoped>
.video-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 40px;
}

.empty-state {
  min-height: 400px;
}
</style>
