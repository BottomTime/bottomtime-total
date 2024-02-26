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
      @keyup.enter="$emit('enter')"
      @keyup.esc="$emit('esc')"
    />
    <span v-if="showRight" :class="rightSlotClasses">
      <slot name="right"></slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

type FormTextBoxProps = {
  autofocus?: boolean;
  controlId?: string;
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
  invalid: false,
  password: false,
  selectOnFocus: false,
  showRight: false,
  showLeft: false,
});

const model = defineModel<string | number>();
const input = ref<HTMLInputElement | null>();

const inputClasses = computed(() => {
  const highlightColour = props.invalid ? 'danger' : 'grey-600';
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

  return `pl-2 pr-2 pt-1 pb-1 w-full appearance-none ${selectStyle} bg-gray-200 dark:bg-grey-300 border border-${highlightColour} focus:ring-${highlightColour} ${roundingStyle} text-black placeholder-grey-700`;
});

const rightSlotClasses = computed(() => {
  const highlightColour = props.invalid ? 'danger' : 'grey-600';
  return `inline-flex items-center px-3 text-sm bg-gray-200 dark:bg-grey-300 text-black border border-${highlightColour} rounded-s-0 rounded-e-lg`;
});

defineEmits<{
  (e: 'enter'): void;
  (e: 'esc'): void;
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
