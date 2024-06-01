<template>
  <label :for="controlId" class="flex space-x-3 items-center">
    <input
      :id="controlId"
      v-model="checked"
      type="checkbox"
      :data-testid="testId"
      :disabled="disabled"
      class="form-checkbox h-4 w-4 text-primary rounded-md"
    />
    <div>
      <slot></slot>
    </div>
  </label>
</template>

<script setup lang="ts">
type FormCheckBoxProps = {
  controlId?: string;
  testId?: string;
  disabled?: boolean;
};

const checked = defineModel<boolean>();
withDefaults(defineProps<FormCheckBoxProps>(), {
  disabled: false,
});
</script>
