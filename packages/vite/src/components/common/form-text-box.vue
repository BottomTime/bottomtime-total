<template>
  <div class="relative">
    <input
      :id="controlId"
      ref="input"
      v-model="model"
      :type="password ? 'password' : 'text'"
      :class="`pl-2 pr-2 pt-1 pb-1 w-full border-2 rounded-md shadow-sm shadow-blue-400 dark:shadow-blue-700 text-sm dark:text-grey-950 select-all ring-2 ring-offset-1 ring-${highlightColour} caret-${highlightColour}`"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :data-testid="testId"
    />
    <div class="absolute right-2 top-1.5">
      <slot name="right"></slot>
    </div>
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
  testId?: string;
};

const props = withDefaults(defineProps<FormTextBoxProps>(), {
  autofocus: false,
  invalid: false,
  password: false,
});

const model = defineModel<string>();
const input = ref<HTMLInputElement | null>();

const highlightColour = computed(() => (props.invalid ? 'danger' : 'grey-600'));

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
