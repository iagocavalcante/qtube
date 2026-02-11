<template>
  <media-grid :type="'musics'"/>
</template>

<script>
import MediaGrid from '../components/mediaGrid.vue';

export default {
  name: 'MusicsPage',
  components: {
    MediaGrid
  }
}
</script>

<style scoped>

.media-card:hover .play-icon {
  opacity: 1;
  transform: scale(1.1);
}

.play-icon {
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

</style>
