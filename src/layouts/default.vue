<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-tabs
        color="purple"
      >
        <q-route-tab to="/index" icon="get_app" replace label="Download" />
        <q-route-tab to="/videos" icon="perm_media" replace label="Videos" />
        <q-route-tab to="/musics" icon="queue_music" replace label="Musics" />
        <q-route-tab :to="path" icon="theaters" replace label="Player" />
        <q-tab class="updates" :count="updatesAvailabe" @click="update()" icon="settings" replace label="Updates" />
        <q-tab class="minimize" @click="minimizeApp()" icon="minimize" replace label="Minimize" />
        <q-tab class="absolute-right" @click="closeApp()" icon="power_settings_new" replace label="Poweroff" />
      </q-tabs>
    </q-header>

    <q-page-container class="background">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'LayoutDefault',
  data () {
    return {
      path: {
        name: 'player',
        params: {
          src: '',
          img: ''
        }
      },
      updatesAvailabe: null
    }
  },
  mounted () {
    this.videoSelected()
    this.initialize()
    setTimeout(() => {
      this.checkUpdates()
    }, 1000)
  },
  unmounted () {
    // Clean up event listeners
    if (window.electronAPI) {
      window.electronAPI.removeUpdateListener()
    }
  },
  methods: {
    closeApp () {
      if (window.electronAPI) {
        window.electronAPI.closeApp()
      }
    },
    minimizeApp () {
      if (window.electronAPI) {
        window.electronAPI.minimize()
      }
    },
    videoSelected () {
      const selected = JSON.parse(window.localStorage.getItem('media') || '{}')
      if (selected && selected.src) {
        this.path.params.src = selected.src
        this.path.params.img = selected.thumbnail
      }
    },
    async initialize () {
      if (window.electronAPI) {
        await window.electronAPI.createYtDownFolder()
        await window.electronAPI.createVideosFolder()
        await window.electronAPI.createMusicFolder()
        await window.electronAPI.createDatabaseFolder()
        await window.electronAPI.createFileDatabase()
      }
    },
    checkUpdates () {
      if (window.electronAPI) {
        window.electronAPI.onUpdateReady(() => {
          this.updatesAvailabe = '1'
        })
      }
    },
    update () {
      if (window.electronAPI) {
        window.electronAPI.quitAndInstall()
      }
    }
  }
}
</script>

<style>
::-webkit-scrollbar {
display: none;
}
.minimize {
  margin-left: 0em;
}

.updates {
  margin-left: 12em;
}
.background{
  background: #fff url(../statics/darkrola.jpeg);
  /* Full height */
  height: 100%;
  /* Center and scale the image nicely */
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
