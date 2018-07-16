<template>
  <q-layout view="lHh Lpr lFf">
    <q-layout-header>
      <q-tabs
        color="purple"
      >
        <q-route-tab slot="title" to="/" icon="get_app" replace label="Download" />
        <q-route-tab slot="title" to="/videos" icon="perm_media" replace label="Videos" />
        <q-route-tab class="absolute-right" slot="title" to="/mails" icon="power_settings_new" replace label="Poweroff" />
      </q-tabs>
    </q-layout-header>

    <q-page-container class="background">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>

export default {
  name: 'LayoutDefault'
}
</script>

<style>
::-webkit-scrollbar {
display: none;
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
