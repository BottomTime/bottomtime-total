<template>
  <span>{{ text }}</span>
</template>

<script lang="ts" setup>
import { PressureUnit } from '@bottomtime/api';

import { computed } from 'vue';

import { useCurrentUser } from '../../store';

type PressureTextProps = {
  pressure: number;
  unit?: PressureUnit;
};

const props = withDefaults(defineProps<PressureTextProps>(), {
  unit: PressureUnit.Bar,
});
const currentUser = useCurrentUser();

const text = computed(() => {
  if (!currentUser.user) {
    return props.unit === PressureUnit.Bar
      ? `${props.pressure.toFixed(0)} bar`
      : `${props.pressure.toFixed(0)} psi`;
  }

  const preferredUnit = currentUser.user.settings.pressureUnit;

  if (preferredUnit === props.unit) {
    // No conversion necessary. Just render the string.
    return preferredUnit === PressureUnit.Bar
      ? `${props.pressure.toFixed(0)} bar`
      : `${props.pressure.toFixed(0)} psi`;
  }

  // Convert the pressure to the preferred unit and render the string.
  return preferredUnit === PressureUnit.Bar
    ? `${(props.pressure / 14.5038).toFixed(0)} bar`
    : `${(props.pressure * 14.5038).toFixed(0)} psi`;
});
</script>
