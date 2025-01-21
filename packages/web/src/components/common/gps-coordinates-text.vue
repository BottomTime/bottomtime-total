<template>
  <span>{{ coordinatesText }}</span>
</template>

<script lang="ts" setup>
import { GpsCoordinates } from '@bottomtime/api';

import { computed } from 'vue';

interface GpsCoordinatesTextProps {
  coordinates?: GpsCoordinates;
}

const props = defineProps<GpsCoordinatesTextProps>();

const coordinatesText = computed<string>(() => {
  if (!props.coordinates) return 'Unspecified';

  return `${props.coordinates.lat.toFixed(5)} ${
    props.coordinates.lat >= 0 ? 'N' : 'S'
  }, ${props.coordinates.lon.toFixed(5)} ${
    props.coordinates.lon >= 0 ? 'E' : 'W'
  }`;
});
</script>
