<template>
  <GoogleMap
    :api-key="Config.googleApiKey"
    class="w-full aspect-video"
    :control-size="30"
    :fullscreen-control="false"
    :center="{
      lat: currentCenter.lat,
      lng: currentCenter.lon,
    }"
    :street-view-control="false"
    :zoom="8"
    @click="onMapClick"
  >
    <Marker
      v-if="marker"
      :options="{ position: { lat: marker.lat, lng: marker.lon } }"
    />
  </GoogleMap>
</template>

<script setup lang="ts">
import { GpsCoordinates } from '@bottomtime/api';

import { onBeforeMount, ref } from 'vue';
import { GoogleMap, Marker } from 'vue3-google-map';

import { Config } from '../../config';

type GoogleMapProps = {
  center?: GpsCoordinates;
  disabled?: boolean;
  marker?: GpsCoordinates;
};

// Toronto, Ontario... for now
const DefaultCenter = { lat: 43.70011, lon: -79.4163 };

const props = withDefaults(defineProps<GoogleMapProps>(), {
  disabled: false,
});
const emit = defineEmits<{
  (e: 'click', location: GpsCoordinates): void;
}>();

const currentCenter = ref<GpsCoordinates>(
  props.center ?? props.marker ?? DefaultCenter,
);

onBeforeMount(async () => {
  if (!props.center && !props.marker) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentCenter.value = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
      },
      (error) => {
        /* eslint-disable-next-line no-console */
        console.error('Error getting current position', error);
      },
    );
  }
});

function onMapClick(event: globalThis.google.maps.MapMouseEvent) {
  if (event.latLng && !props.disabled) {
    emit('click', {
      lat: event.latLng.lat(),
      lon: event.latLng.lng(),
    });
  }
}
</script>
