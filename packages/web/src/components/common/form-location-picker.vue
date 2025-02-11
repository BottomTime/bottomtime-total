<template>
  <div class="flex flex-col gap-2 items-center">
    <GoogleMap :marker="location" @click="onMapClick" />
    <div v-if="location">
      <p class="flex gap-2 items-baseline flex-wrap">
        <GpsCoordinatesText :coordinates="location" />
        <a class="text-sm" @click="onClearLocation">Clear</a>
      </p>

      <div v-if="showRadius" class="flex items-baseline gap-0.5">
        <FormSlider
          v-model="radius"
          :min="10"
          :max="500"
          :step="10"
          :show-value="false"
        />
        <span>{{ radius.toFixed(0) }}km</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { GpsCoordinates, GpsCoordinatesWithRadius } from '@bottomtime/api';

import { ref, watch } from 'vue';

import FormSlider from './form-slider.vue';
import GoogleMap from './google-map.vue';
import GpsCoordinatesText from './gps-coordinates-text.vue';

interface FormLocationPickerProps {
  showRadius?: boolean;
}

const location = defineModel<GpsCoordinatesWithRadius>({
  required: false,
});
const radius = ref(location.value?.radius ?? 50);
withDefaults(defineProps<FormLocationPickerProps>(), {
  showRadius: false,
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

watch(radius, (newRadius) => {
  if (location.value) {
    location.value.radius = newRadius;
  }
});

watch(location, (newLocation) => {
  if (newLocation?.radius) {
    radius.value = newLocation.radius;
  }
});
</script>
