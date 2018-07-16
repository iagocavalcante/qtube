<template>
  <q-page>
    <q-page-container>
      <div class="row">
        <div class="col-md-3 row justify-center">
          <q-card inline class="col-md-10" color="purple">
            <q-card-media>
              <img src="data:image/png;base64,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">
            </q-card-media>
            <q-card-title class="relative-position">
              <div class="ellipsis">Cafe Basilico</div>
              <div slot="right" class="row items-center">
                <q-icon name="remove_red_eye" />
              </div>
            </q-card-title>
            <q-card-main>
              <p>Small plates, salads & sandwiches in an intimate setting.</p>
            </q-card-main>
            <q-card-separator />
            <q-card-actions>
              <q-btn flat color="white">
                <q-icon class="q-mr-sm" name="play_circle_filled">
                </q-icon>
                VIEW</q-btn>
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </q-page-container>
  </q-page>
</template>

<script>
export default {
  name: 'VideoPage'
}
</script>

<style>
</style>
