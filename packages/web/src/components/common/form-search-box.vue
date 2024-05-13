<template>
  <div class="relative">
    <FormTextBox
      v-model="query"
      :autofocus="autofocus"
      :control-id="controlId"
      :disabled="disabled"
      :invalid="invalid"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :test-id="testId"
      @enter="$emit('search')"
    />

    <button
      class="absolute inset-y-0 end-0 rounded-r-lg border border-grey-950 w-8 flex justify-center items-center text-grey-950 disabled:text-grey-500 bg-secondary hover:bg-secondary-hover"
      @click="$emit('search')"
    >
      <span>
        <i class="fa-solid fa-magnifying-glass"></i>
      </span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import FormTextBox from './form-text-box.vue';

interface FormSearchBoxProps {
  autofocus?: boolean;
  controlId?: string;
  disabled?: boolean;
  invalid?: boolean;
  maxlength?: number;
  placeholder?: string;
  testId?: string;
}

const query = defineModel<string>({ required: false, default: '' });

withDefaults(defineProps<FormSearchBoxProps>(), {
  autofocus: false,
  disabled: false,
  invalid: false,
  placeholder: 'Search...',
});
defineEmits<{
  (e: 'search'): void;
}>();
</script>
