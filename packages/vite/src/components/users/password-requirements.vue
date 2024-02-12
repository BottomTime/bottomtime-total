<template>
  <div
    v-if="showText"
    class="flex flex-row gap-4 align-top bg-link p-3 rounded-md text-sm"
  >
    <span class="mt-3">
      <i class="fas fa-lock fa-3x"></i>
    </span>
    <div class="grow">
      <span>Passwords must meet the following strength requirements.</span>
      <ul class="list-inside list-disc italic">
        <li>At least 8 characters long</li>
        <li>At least 1 uppercase letter</li>
        <li>At least 1 lowercase letter</li>
        <li>At least 1 number</li>
        <li>At least 1 special character</li>
      </ul>
    </div>
    <div>
      <CloseButton @close="showText = false" />
    </div>
  </div>

  <NavLink v-else to="#" class="text-sm" @click="showText = true">
    <span class="mr-2">
      <i class="fas fa-question-circle fa-sm"></i>
    </span>
    <span>Password strength requirements</span>
  </NavLink>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import CloseButton from '../common/close-button.vue';
import NavLink from '../common/nav-link.vue';

type PasswordRequirementsProps = {
  showText?: boolean;
};

const props = withDefaults(defineProps<PasswordRequirementsProps>(), {
  showText: false,
});
const showText = ref(props.showText);

defineEmits<{
  (e: 'dismiss'): void;
}>();
</script>
