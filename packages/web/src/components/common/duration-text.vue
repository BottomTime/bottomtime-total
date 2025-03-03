<template>
  <span>{{ duration }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface DurationTextProps {
  duration?: number;
}

const props = defineProps<DurationTextProps>();
const duration = computed(() => {
  if (props.duration === undefined) return 'Unspecified';

  const hours = Math.floor(props.duration / 3600);
  const minutes = Math.floor((props.duration % 3600) / 60);
  const seconds = props.duration % 60;

  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
    .toFixed(2)
    .padStart(2, '0')}`;
});
</script>
