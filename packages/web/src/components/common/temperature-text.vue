<template>
  <span>{{ text }}</span>
</template>

<script lang="ts" setup>
import { TemperatureUnit } from '@bottomtime/api';

import { computed } from 'vue';

import { useCurrentUser } from '../../store';

interface TemperatureTextProps {
  temperature: number;
  unit?: TemperatureUnit;
}

const props = withDefaults(defineProps<TemperatureTextProps>(), {
  unit: TemperatureUnit.Celsius,
});
const currentUser = useCurrentUser();

const text = computed(() => {
  if (!currentUser.user) {
    return props.unit === TemperatureUnit.Celsius
      ? `${props.temperature.toFixed(1)} °C`
      : `${props.temperature.toFixed(1)} °F`;
  }

  const preferredUnit = currentUser.user.settings.temperatureUnit;

  if (preferredUnit === props.unit) {
    // No conversion necessary. Just render the string.
    return preferredUnit === TemperatureUnit.Celsius
      ? `${props.temperature.toFixed(1)} °C`
      : `${props.temperature.toFixed(1)} °F`;
  }

  // Convert the temperature to the preferred unit and render the string.
  return preferredUnit === TemperatureUnit.Celsius
    ? `${(((props.temperature - 32) * 5) / 9).toFixed(1)} °C`
    : `${((props.temperature * 9) / 5 + 32).toFixed(1)} °F`;
});
</script>
