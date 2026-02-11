<template>
  <q-page class="q-pa-md">
    <q-ajax-bar ref="bar" color="accent" />

    <!-- Videos/Music Grid -->
    <div v-if="checkDatabase" class="row q-col-gutter-md">
      <div
        v-for="(info, index) in infos"
        :key="index"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="media-card" flat bordered>
          <q-img
            :src="getThumbnailUrl(info.thumbnail)"
            :ratio= "config.cardRatio"
            class="cursor-pointer"
            @click="goTo(info)"
          >
            <template v-slot:error>
              <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                <q-icon :name="config.errorIconName" size="48px" />
              </div>
            </template>
            <div v-if="type === videos" class="absolute-bottom-right q-pa-xs">
              <q-icon name="play_circle" size="32px" color="white" class="shadow-2" />
            </div>
            <div v-else class="absolute-full flex flex-center bg-transparent">
              <q-icon name="play_circle" size="64px" color="white" class="play-icon" />
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
              :icon="config.cardActIcon"
              :label="config.cardActLabel"
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
      <q-icon :name="config.emptyIconName" size="80px" color="grey-5" /> 
      <div class="text-h6 text-grey-6 q-mt-md">No {{ config.type }} yet</div>
      <div class="text-body2 text-grey-5">Download some {{ config.type }} to see them here</div>
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
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'MediaGrid',
  props: {
    type: {
        type: String,
        required: true
    }
  },
  setup(props) {
    const infos = ref([])
    const checkDatabase = ref(false)
    const appFolder = ref('')
    const bar = ref(null)

    const mediaConfig = {
        videos: { 
            cardRatio:16/9, 
            errorIconName: "videocam_off", 
            cardActIcon: "play_circle",
            cardActLabel: "Watch",
            emptyIconName: "video_library",
            type: "videos"
        },
        musics: { 
            cardRatio:1, 
            errorIconName: "music_off", 
            cardActIcon: "play_arrow",
            cardActLabel: "Play",
            emptyIconName: "library_music",
            type: "musics"
        },
    }

    const config = computed(() => mediaConfig[props.type])

    onMounted(async () => {
        if(window.electronAPI) {
            appFolder.value = await window.electronAPI.getFolderApp()

            listMedia()
        }
    })

    const getThumbnailUrl = (thumbnail) => {
      if (!thumbnail || !appFolder.value) return ''
      return `file://${appFolder.value}${thumbnail}`
    }

    const listMedia = async () => {
      if (bar.value) bar.value.start()
      try {
        if (window.electronAPI) {
          const data = await window.electronAPI.getDownloads()
          infos.value = data[props.type] || []
          checkDatabase.value = infos.value.length > 0
        }
      } catch (err) {
        console.error(`Failed to load ${props.type}:`, err)
      } finally {
        if (bar.value) bar.value.stop()
      }
    }

    const goTo = (info) => {
        mediaSelect(info)
        const router = useRouter();
        router.push({ name: 'player' })
    }

    const mediaSelect = (info) => {
        window.localStorage.setItem('media', JSON.stringify(info))
    }

    const openFolder = (info) => {
      if (window.electronAPI && window.electronAPI.openFolder) {
        const folder = `${this.appFolder}${props.type}/${info.title}/`
        window.electronAPI.openFolder(folder)
      }
    }

    return { infos, checkDatabase, appFolder, config, getThumbnailUrl, goTo, openFolder }
  }
}
</script>

<style scoped>
.media-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.media-card:hover {
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