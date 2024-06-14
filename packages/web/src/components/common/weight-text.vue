<template>
  <span>{{ text }}</span>
</template>

<script lang="ts" setup>
import { WeightUnit } from '@bottomtime/api';

import { computed } from 'vue';

import { useCurrentUser } from '../../store';

interface WeightTextProps {
  weight: number;
  unit: WeightUnit;
}

const currentUser = useCurrentUser();

const props = defineProps<WeightTextProps>();
const text = computed(() => {
  if (!currentUser.user) {
    return props.unit === WeightUnit.Kilograms
      ? `${props.weight.toFixed(1)} kg`
      : `${props.weight.toFixed(1)} lb`;
  }

  const preferredUnit = currentUser.user.settings.weightUnit;

  if (preferredUnit === props.unit) {
    // No conversion necessary. Just render the string.
    return preferredUnit === WeightUnit.Kilograms
      ? `${props.weight.toFixed(1)} kg`
      : `${props.weight.toFixed(1)} lb`;
  }

  // Convert the weight to the preferred unit and render the string.
  return preferredUnit === WeightUnit.Kilograms
    ? `${(props.weight / 2.20462).toFixed(1)} kg`
    : `${(props.weight * 2.20462).toFixed(1)} lb`;
});
</script>
