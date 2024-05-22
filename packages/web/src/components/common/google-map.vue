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
    :zoom="5"
    @click="onMapClick"
  >
    <Marker
      v-if="marker"
      :options="{ position: { lat: marker.lat, lng: marker.lon } }"
    />
    <CustomMarker
      v-for="site in mapSites"
      :key="site.id"
      :options="{
        position: { lat: site.gps!.lat, lng: site.gps!.lon },
      }"
    >
      <a
        :href="`#${site.id}`"
        class="flex items-center space-x-1 pr-0 z-10 hover:z-30 hover:pr-1 rounded-md h-[16px] shadow-sm bg-grey-200 group"
        @click="$emit('site-selected', site)"
      >
        <img
          class="w-[16px] h-[16px] rounded-md shadow-sm shadow-danger-hover"
          src="/img/flag-marker.svg"
          :alt="site.name"
        />
        <span class="hidden group-hover:block text-grey-950 text-xs capitalize">
          {{ site.name }}
        </span>
      </a>
    </CustomMarker>
  </GoogleMap>
</template>

<script setup lang="ts">
import { DiveSiteDTO, GpsCoordinates } from '@bottomtime/api';

import { computed, onBeforeMount, ref } from 'vue';
import { CustomMarker, GoogleMap, Marker } from 'vue3-google-map';

import { Config } from '../../config';

type GoogleMapProps = {
  center?: GpsCoordinates;
  disabled?: boolean;
  marker?: GpsCoordinates;
  sites?: DiveSiteDTO[];
};

// Toronto, Ontario... for now
const DefaultCenter = { lat: 43.70011, lon: -79.4163 };

const props = withDefaults(defineProps<GoogleMapProps>(), {
  disabled: false,
});
const emit = defineEmits<{
  (e: 'click', location: GpsCoordinates): void;
  (e: 'site-selected', site: DiveSiteDTO): void;
}>();

const currentCenter = ref<GpsCoordinates>(
  props.center ?? props.marker ?? DefaultCenter,
);
const mapSites = computed<DiveSiteDTO[]>(
  () => props.sites?.filter((site) => !!site.gps) ?? [],
);

onBeforeMount(async () => {
  if (!props.center && !props.marker && navigator.geolocation) {
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
