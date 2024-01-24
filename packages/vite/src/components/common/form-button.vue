<template>
  <button :class="classes" :data-testid="testId" @click="$emit('click')">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ButtonType } from '../../common';

type FormButtonProps = {
  type?: ButtonType;
  testId?: string;
};

const props = withDefaults(defineProps<FormButtonProps>(), {
  type: ButtonType.Normal,
});

const classes = computed(() => {
  const baseButton =
    'text-black p-2 m-0 text-sm rounded-md outline-2 outline-grey-800 shadow-md shadow-grey-800';
  const baseButtonWithGradient = `${baseButton} bg-gradient-to-t`;
  switch (props.type) {
    case ButtonType.Primary:
      return `${baseButtonWithGradient} from-primary-dark hover:to-primary-hover to-primary font-bold`;

    case ButtonType.Link:
      return 'text-link hover:text-link-hover p-2 m-1 text-sm';

    case ButtonType.Danger:
      return `${baseButtonWithGradient} from-danger-dark hover:to-danger-hover to-danger font-bold`;

    case ButtonType.Normal:
    default:
      return `${baseButton} bg-secondary hover:bg-secondary-hover`;
  }
});

defineEmits<{
  (e: 'click'): void;
}>();
</script>
