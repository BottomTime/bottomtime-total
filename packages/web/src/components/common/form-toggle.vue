<template>
  <label class="relative inline-flex items-center cursor-pointer">
    <input
      :id="controlId"
      v-model="value"
      type="checkbox"
      value=""
      class="sr-only peer"
      :data-testid="testId"
    />
    <div
      class="w-11 h-6 bg-grey-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-700 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 dark:bg-blue-600 peer-checked:bg-blue-400"
    ></div>
    <span class="ms-3">
      {{ label }}
    </span>
  </label>
</template>

<script setup lang="ts">
type FormToggleProps = {
  controlId?: string;
  label: string;
  testId?: string;
};

const value = defineModel<boolean>();
defineProps<FormToggleProps>();
</script>
