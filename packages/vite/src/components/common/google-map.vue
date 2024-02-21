<template>
  <div
    ref="mapPlaceholder"
    class="w-[600px] h-[400px] text-center border-2 border-grey-400 rounded-md"
  >
    <p class="mt-[200px]">
      <span class="mr-2">
        <i class="fas fa-spinner fa-spin"></i>
      </span>
      <span class="italic">Loading map...</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import * as GoogleMaps from '@googlemaps/js-api-loader';

import { onMounted, ref } from 'vue';

import { Config } from '../../config';

const mapPlaceholder = ref<HTMLElement | null>(null);
let map: globalThis.google.maps.Map | undefined;

function onMapClicked(
  event:
    | globalThis.google.maps.MapMouseEvent
    | globalThis.google.maps.IconMouseEvent,
) {
  if (event.latLng) {
    console.log('Map clicked:', event.latLng.lat(), event.latLng.lng());
    map?.data.add({
      geometry: new globalThis.google.maps.Data.Point(event.latLng),
    });
  }
}

onMounted(async () => {
  if (!mapPlaceholder.value) return;

  const loader = new GoogleMaps.Loader({
    apiKey: Config.googleApiKey,
    version: 'weekly',
  });

  const { Map } = await loader.importLibrary('maps');
  map = new Map(mapPlaceholder.value, {
    center: { lat: 43.70011, lng: -79.4163 }, // TODO: Invoke Location API to get user's current location.
    fullscreenControl: false,
    streetViewControl: false,
    zoom: 8,
  });

  map.addListener('click', onMapClicked);
});
</script>
