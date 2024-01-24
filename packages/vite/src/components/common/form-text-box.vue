<template>
  <input
    :type="password ? 'password' : 'text'"
    :class="`pl-2 pr-2 pt-1 pb-1 border-2 ${
      invalid ? 'border-danger' : 'border-grey-600'
    } outline-offset-1 rounded-md shadow-sm shadow-blue-400 text-sm`"
    :data-testid="testId"
    v-model="model"
  />
</template>

<script setup lang="ts">
type FormTextBoxProps = {
  invalid?: boolean;
  password?: boolean;
  testId?: string;
};

withDefaults(defineProps<FormTextBoxProps>(), {
  invalid: false,
  password: false,
});

const model = defineModel<string>();
</script>
