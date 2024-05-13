<template>
  <button
    :id="controlId"
    :class="classes"
    :data-testid="testId"
    :type="submit ? 'submit' : 'button'"
    :disabled="disabled || isLoading"
    @click="$emit('click')"
  >
    <span v-if="isLoading" class="mr-2">
      <i class="fas fa-spinner fa-spin"></i>
    </span>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type FormButtonProps = {
  controlId?: string;
  disabled?: boolean;
  isLoading?: boolean;
  rounded?: boolean | 'left' | 'right' | 'top' | 'bottom' | 'start' | 'end';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  stretch?: boolean;
  submit?: boolean;
  testId?: string;
  type?: 'primary' | 'link' | 'danger' | 'normal';
};

const props = withDefaults(defineProps<FormButtonProps>(), {
  disabled: false,
  isLoading: false,
  rounded: true,
  size: 'sm',
  stretch: false,
  submit: false,
  type: 'normal',
});

function getRounding(): string {
  switch (props.rounded) {
    case true:
      return 'rounded-md';
    case false:
      return 'rounded-none';
    case 'left':
      return 'rounded-l-md';
    case 'right':
      return 'rounded-r-md';
    case 'top':
      return 'rounded-t-md';
    case 'bottom':
      return 'rounded-b-md';
    case 'start':
      return 'rounded-s-md';
    case 'end':
      return 'rounded-e-md';
  }
}

const classes = computed(() => {
  const baseButton = `text-grey-950 p-2 m-0 text-${
    props.size
  } border-1 border-grey-800 shadow-sm shadow-grey-800 ${getRounding()}`;
  const baseButtonWithGradient = `${baseButton} bg-gradient-to-t`;
  let classes: string;

  switch (props.type) {
    case 'primary':
      classes = `${baseButtonWithGradient} disabled:text-grey-300 from-primary-dark hover:to-primary-hover to-primary font-bold`;
      break;

    case 'link':
      classes = `text-link hover:text-link-hover text-${props.size}`;
      break;

    case 'danger':
      classes = `${baseButtonWithGradient} disabled:text-grey-300 from-danger-dark hover:to-danger-hover to-danger`;
      break;

    case 'normal':
    default:
      classes = `${baseButton} disabled:text-grey-500 bg-secondary hover:bg-secondary-hover`;
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
