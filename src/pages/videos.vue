<template>
  <media-grid :type="'videos'"/>
</template>

<script>
import MediaGrid from '../components/mediaGrid.vue';

export default {
  name: 'VideoPage',
  components: {
    MediaGrid
  }
}
</script>
