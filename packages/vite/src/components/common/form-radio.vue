<template>
  <label :for="controlId" class="flex flex-row gap-1.5">
    <input
      :id="controlId"
      v-model="model"
      class="accent-blue-800 dark:accent-blue-300"
      type="radio"
      :name="group"
      :value="value"
      :disabled="disabled"
      :data-testid="testId"
    />
    <slot></slot>
  </label>
</template>

<script setup lang="ts">
type FormRadioProps = {
  controlId: string;
  disabled?: boolean;
  group: string;
  testId?: string;
  value: string;
};

const model = defineModel<string>();
withDefaults(defineProps<FormRadioProps>(), {
  disabled: false,
});
</script>
