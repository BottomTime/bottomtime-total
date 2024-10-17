<template>
  <p class="inline-block relative">
    <button @click.prevent="onCopy">
      <i class="fa-solid fa-copy"></i>
    </button>
    <span :class="toolTipClasses">Copied!</span>
  </p>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

interface CopyButtonProps {
  value?: string;
  tooltipPosition?: 'top' | 'left' | 'bottom' | 'right';
}

const props = withDefaults(defineProps<CopyButtonProps>(), {
  tooltipPosition: 'top',
});
const emit = defineEmits<{
  (e: 'copied', value: string): void;
}>();
const showCopied = ref(false);

function getPositionClasses(): Record<string, true> {
  switch (props.tooltipPosition) {
    case 'left':
      return {
        'top-0': true,
        'right-[120%]': true,
      };

    case 'right':
      return {
        'top-0': true,
        'left-[120%]': true,
      };

    case 'bottom':
      return {
        'top-[120%]': true,
        'left-[50%]': true,
        'translate-x-[-50%]': true,
      };

    default:
    case 'top':
      return {
        'bottom-[120%]': true,
        'left-[50%]': true,
        'translate-x-[-50%]': true,
      };
  }
}

const toolTipClasses = computed(() => {
  return {
    absolute: true,
    'px-3': true,
    'z-[600]': true,
    'rounded-full': true,
    'bg-primary-dark': true,
    'text-grey-100': true,
    'text-sm': true,
    'opacity-100': showCopied.value,
    'opacity-0': !showCopied.value,
    'transition-opacity': true,
    'transition-duration-300': true,
    ...getPositionClasses(),
  };
});

function onCopy() {
  if (props.value) {
    window.navigator.clipboard.writeText(props.value);
    showCopied.value = true;
    setTimeout(() => {
      showCopied.value = false;
    }, 2500);
    emit('copied', props.value);
  }
}
</script>
