<template>
  <div :class="outerClasses">
    <div :class="innerClasses">
      <p class="text-3xl font-bold font-title capitalize">
        {{ alert.title }}
      </p>

      <MarkdownViewer v-model="message" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { AlertDTO } from '@bottomtime/api';

import { computed, ref } from 'vue';

import MarkdownViewer from '../common/markdown-viewer.vue';

interface AlertsCarouselItemProps {
  alert: AlertDTO;
  relativePosition?: number;
}

const props = withDefaults(defineProps<AlertsCarouselItemProps>(), {
  relativePosition: 0,
});

const message = ref(props.alert.message);
const outerClasses = computed<Record<string, boolean>>(() => ({
  absolute: true,
  'w-full': true,
  'transition-transform': true,
  'ease-in-out': true,
  'duration-700': true,
  '-translate-x-full': props.relativePosition < 0,
  'translate-x-0': props.relativePosition === 0,
  'translate-x-full': props.relativePosition > 0,
  'top-0': true,
  hidden: props.relativePosition < -1 || props.relativePosition > 1,
}));
const innerClasses = computed<Record<string, boolean>>(() => ({
  'text-grey-950': true,
  'px-20': true,
  'py-3': true,
  'space-y-4': true,
}));
</script>
