<template>
  <label :for="controlId" class="flex flex-row gap-2">
    <input
      :id="controlId"
      v-model="model"
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
