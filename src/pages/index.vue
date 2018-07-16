<template>
  <q-page class="flex flex-center row">
    <q-field
      icon="ondemand_video"
      icon-color="purple"
      class="col-8"
    >
      <q-input inverted v-model="youtubeUrl" color="purple" stack-label="Video URL" />
    </q-field>
    <div class="flex flex-center q-pa-sm">
      <q-btn
        class="col-5"
        color="purple"
        size="lg"
        label="Download"
      />
    </div>
    <!-- <q-btn round class="on-right" color="purple">
      <q-icon name="build" />
    </q-btn> -->
    <q-btn-dropdown  icon="build" class="on-right round" color="purple">
      <!-- dropdown content -->
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
      youtubeUrl: ''
    }
  }
}
</script>
