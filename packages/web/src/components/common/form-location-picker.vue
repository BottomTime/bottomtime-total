<template>
  <div class="flex flex-col gap-2 items-center">
    <GoogleMap :marker="location" @click="onMapClick" />
    <div v-if="location">
      <p class="flex gap-2 items-baseline flex-wrap">
        <GpsCoordinatesText :coordinates="location" />
        <a class="text-sm" @click="onClearLocation">Clear</a>
      </p>

      <p v-if="location.radius" class="flex items-baseline gap-0.5">
        <FormSlider
          v-model="location.radius"
          :min="10"
          :max="500"
          :step="10"
          :show-value="false"
        />
        <span>{{ location.radius }}km</span>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { GpsCoordinates, GpsCoordinatesWithRadius } from '@bottomtime/api';

import FormSlider from './form-slider.vue';
import GoogleMap from './google-map.vue';
import GpsCoordinatesText from './gps-coordinates-text.vue';

const location = defineModel<GpsCoordinatesWithRadius>({
  required: false,
});

function onMapClick(newLocation: GpsCoordinates) {
  location.value = {
    ...newLocation,
    radius: location.value?.radius ?? 50,
  };
}

function onClearLocation() {
  location.value = undefined;
}
</script>
