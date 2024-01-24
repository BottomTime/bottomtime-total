<template>
  <button
    :class="classes"
    :data-testid="testId"
    :type="submit ? 'submit' : 'button'"
    @click="$emit('click')"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type FormButtonProps = {
  stretch?: boolean;
  submit?: boolean;
  testId?: string;
  type?: 'primary' | 'link' | 'danger' | 'normal';
};

const props = withDefaults(defineProps<FormButtonProps>(), {
  stretch: false,
  submit: false,
  type: 'normal',
});

const classes = computed(() => {
  const baseButton =
    'text-black p-2 m-0 text-sm rounded-md outline-2 outline-grey-800 shadow-sm shadow-grey-800';
  const baseButtonWithGradient = `${baseButton} bg-gradient-to-t`;
  let classes: string;

  switch (props.type) {
    case 'primary':
      classes = `${baseButtonWithGradient} from-primary-dark hover:to-primary-hover to-primary font-bold`;
      break;

    case 'link':
      classes = 'text-link hover:text-link-hover p-2 m-1 text-sm';
      break;

    case 'danger':
      classes = `${baseButtonWithGradient} from-danger-dark hover:to-danger-hover to-danger font-bold`;
      break;

    case 'normal':
    default:
      classes = `${baseButton} bg-secondary hover:bg-secondary-hover`;
      break;
  }

  if (props.stretch) {
    classes = `${classes} w-full`;
  }

  return classes;
});

defineEmits<{
  (e: 'click'): void;
}>();
</script>
