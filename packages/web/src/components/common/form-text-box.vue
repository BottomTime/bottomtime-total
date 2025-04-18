<template>
  <div class="flex">
    <input
      :id="controlId"
      ref="input"
      v-model="model"
      :type="password ? 'password' : 'text'"
      :class="inputClasses"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :data-testid="testId"
      :disabled="disabled"
      @keyup.enter="$emit('enter')"
      @keyup.esc="$emit('esc')"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
    />
    <button
      v-if="showRight"
      :class="rightSlotClasses"
      :data-testid="testId ? `${testId}-right` : undefined"
      @click="$emit('right-button-click')"
    >
      <slot name="right"></slot>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

type FormTextBoxProps = {
  autofocus?: boolean;
  controlId?: string;
  disabled?: boolean;
  invalid?: boolean;
  maxlength?: number;
  password?: boolean;
  placeholder?: string;
  selectOnFocus?: boolean;
  showRight?: boolean;
  showLeft?: boolean;
  testId?: string;
};

const props = withDefaults(defineProps<FormTextBoxProps>(), {
  autofocus: false,
  disabled: false,
  invalid: false,
  password: false,
  selectOnFocus: false,
  showRight: false,
  showLeft: false,
});

const model = defineModel<string | number>();
const input = ref<HTMLInputElement | null>();

const inputClasses = computed(() => {
  const selectStyle = props.selectOnFocus ? 'select-all' : '';
  let roundingStyle: string;

  if (props.showLeft && props.showRight) {
    roundingStyle = 'rounded-md-0';
  } else if (props.showLeft) {
    roundingStyle = 'rounded-e-lg';
  } else if (props.showRight) {
    roundingStyle = 'rounded-s-lg';
  } else {
    roundingStyle = 'rounded-lg';
  }

  return `px-2 py-1 w-full ${selectStyle} bg-grey-200 dark:bg-grey-300 border-2 ${
    props.invalid ? 'border-danger' : 'border-grey-600'
  } ${roundingStyle} text-grey-950 h-8 placeholder-grey-400 disabled:text-grey-700 disabled:bg-grey-400 disabled:dark:bg-grey-500`;
});

const rightSlotClasses = computed(() => {
  const highlightColour = props.invalid ? 'danger' : 'grey-600';
  return `inline-flex items-center px-3 text-sm text-grey-950 bg-gray-200 dark:bg-grey-300 text-black border border-${highlightColour} rounded-s-0 rounded-e-lg`;
});

defineEmits<{
  (e: 'enter'): void;
  (e: 'esc'): void;
  (e: 'right-button-click'): void;
  (e: 'focus'): void;
  (e: 'blur'): void;
}>();

function focus() {
  input.value?.focus();
}

defineExpose({ focus });

onMounted(() => {
  if (props.autofocus) {
    focus();
  }
});
</script>
