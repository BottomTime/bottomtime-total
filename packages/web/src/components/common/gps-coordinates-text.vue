<template>
  <p class="space-x-1 inline-block">
    <span class="text-danger">
      <i class="fa-solid fa-location-dot"></i>
    </span>
    <a
      v-if="link"
      class="space-x-1.5"
      :href="url"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{{ coordinatesText }}</span>
      <span>
        <i class="fa-solid fa-arrow-up-right-from-square"></i>
      </span>
    </a>
    <span v-else>{{ coordinatesText }}</span>
  </p>
</template>

<script lang="ts" setup>
import { GpsCoordinates } from '@bottomtime/api';

import qs from 'qs';
import { computed } from 'vue';

interface GpsCoordinatesTextProps {
  coordinates?: GpsCoordinates;
  link?: boolean | string;
}

const props = withDefaults(defineProps<GpsCoordinatesTextProps>(), {
  link: false,
});

const coordinatesText = computed<string>(() => {
  if (!props.coordinates) return 'Unspecified';

  return `${props.coordinates.lat.toFixed(5)}${
    props.coordinates.lat >= 0 ? 'N' : 'S'
  }, ${props.coordinates.lon.toFixed(5)}${
    props.coordinates.lon >= 0 ? 'E' : 'W'
  }`;
});

const url = computed(() => {
  if (typeof props.link === 'string') return props.link;

  return `https://www.google.com/maps/search/?${qs.stringify({
    api: 1,
    query: `${props.coordinates?.lat},${props.coordinates?.lon}`,
  })}`;
});
</script>
