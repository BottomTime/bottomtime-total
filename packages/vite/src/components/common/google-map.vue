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
import { GpsCoordinates } from '@bottomtime/api';

import * as GoogleMaps from '@googlemaps/js-api-loader';

import { onMounted, ref, watch } from 'vue';

import { Config } from '../../config';

type GoogleMapProps = {
  location?: GpsCoordinates | null;
};

const MarkerId = 'marker';

const props = withDefaults(defineProps<GoogleMapProps>(), { location: null });
const mapPlaceholder = ref<HTMLElement | null>(null);
const emit = defineEmits<{
  (e: 'location-changed', location: GpsCoordinates): void;
}>();

let map: globalThis.google.maps.Map | undefined;

function getLocation(): Promise<globalThis.google.maps.LatLng> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(
          new globalThis.google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude,
          ),
        );
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true },
    );
  });
}

function onMapClicked(
  event:
    | globalThis.google.maps.MapMouseEvent
    | globalThis.google.maps.IconMouseEvent,
) {
  if (event.latLng) {
    emit('location-changed', {
      lat: event.latLng.lat(),
      lon: event.latLng.lng(),
    });
  }
}

function updateMarker() {
  if (!map) return;

  if (props.location) {
    map.data.add({
      id: MarkerId,
      geometry: new globalThis.google.maps.Data.Point(
        new globalThis.google.maps.LatLng(
          props.location.lat,
          props.location.lon,
        ),
      ),
    });
  } else {
    const marker = map.data.getFeatureById(MarkerId);
    if (marker) map.data.remove(marker);
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
    center: props.location
      ? { lat: props.location.lat, lng: props.location.lon }
      : { lat: 43.70011, lng: -79.4163 }, // Default to Toronto... for now.
    fullscreenControl: false,
    streetViewControl: false,
    zoom: 5,
  });

  map.addListener('click', onMapClicked);

  updateMarker();

  if (!props.location) {
    getLocation()
      .then((location) => {
        map?.setCenter(location);
      })
      .catch((error) => {
        /* eslint-disable-next-line no-console */
        console.error('Error getting location:', error);
      });
  }
});

watch(props, updateMarker);
</script>
