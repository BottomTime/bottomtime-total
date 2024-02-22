<template>
  <span>{{ text }}</span>
</template>

<script lang="ts" setup>
import { DepthUnit } from '@bottomtime/api';

import { computed } from 'vue';

import { useCurrentUser } from '../../store';

type DepthTextProps = {
  depth: number;
  unit: DepthUnit;
};

const props = defineProps<DepthTextProps>();
const currentUser = useCurrentUser();

const text = computed(() => {
  if (!currentUser.user) {
    return props.unit === DepthUnit.Meters
      ? `${props.depth.toFixed(2)} m`
      : `${props.depth.toFixed(1)} ft`;
  }

  const preferredUnit = currentUser.user.settings.depthUnit;

  if (preferredUnit === props.unit) {
    // No conversion necessary. Just render the string.
    return preferredUnit === DepthUnit.Meters
      ? `${props.depth.toFixed(2)} m`
      : `${props.depth.toFixed(1)} ft`;
  }

  // Convert the depth to the preferred unit and render the string.
  return preferredUnit === DepthUnit.Meters
    ? `${(props.depth / 3.28084).toFixed(2)} m`
    : `${(props.depth * 3.28084).toFixed(1)} ft`;
});
</script>
