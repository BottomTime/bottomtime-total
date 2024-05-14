<template>
  <div>
    <div
      class="italic mx-2 px-4 py-2 border-l-4 text-grey-950 border-blue-400 bg-blue-300 dark:bg-blue-800 dark:text-grey-200 rounded-r-lg w-full"
    >
      <FormButton
        v-if="!showText"
        size="md"
        type="link"
        @click="showText = !showText"
      >
        <div class="space-x-3">
          <span>
            <i class="fas fa-question-circle"></i>
          </span>
          <span>Password strength requirements</span>
        </div>
      </FormButton>

      <div v-if="showText" class="flex gap-4">
        <span class="mt-3">
          <i class="fas fa-lock fa-3x"></i>
        </span>
        <div class="grow space-y-2">
          <span>Passwords must meet the following strength requirements.</span>
          <ul class="list-inside list-disc italic">
            <li>At least 8 characters long</li>
            <li>At least 1 uppercase letter</li>
            <li>At least 1 lowercase letter</li>
            <li>At least 1 number</li>
            <li>At least 1 special character</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import CloseButton from '../common/close-button.vue';
import FormButton from '../common/form-button.vue';
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
