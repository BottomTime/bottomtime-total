<template>
  <Teleport to="#modal">
    <Transition name="backdrop">
      <div
        v-if="visible"
        class="fixed block top-0 left-0 w-full h-full backdrop-blur-sm z-[490]"
        data-testid="dialog-backdrop"
        @click="onClose"
      ></div>
    </Transition>
    <div
      v-if="visible"
      data-testid="dialog-modal"
      :class="`flex flex-col fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] ${sizeClass} bg-grey-200 dark:bg-grey-800 opacity-100 shadow-lg rounded-lg z-[500]`"
    >
      <!-- Title bar -->
      <div
        class="flex flex-row bg-blue-800 text-grey-100 h-8 p-1 rounded-t-lg items-center"
      >
        <div
          class="grow flex-nowrap font-title pl-2"
          data-testid="dialog-title"
        >
          {{ title }}
        </div>
        <div class="pr-2">
          <CloseButton
            v-if="showClose"
            :disabled="disabled"
            test-id="dialog-close-button"
            inverted
            @click="onClose"
          />
        </div>
      </div>

      <form @submit.prevent="">
        <fieldset :disabled="disabled">
          <!-- Content -->
          <div class="grow p-4" data-testid="dialog-content">
            <slot></slot>
          </div>

          <!-- Buttons-->
          <div
            class="h-12 text-center p-2 mb-3 flex flex-row justify-center gap-3"
          >
            <slot name="buttons"></slot>
          </div>
        </fieldset>
      </form>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import CloseButton from '../common/close-button.vue';

type DialogBaseProps = {
  disabled?: boolean;
  showClose?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title: string;
  visible?: boolean;
};

const props = withDefaults(defineProps<DialogBaseProps>(), {
  disabled: false,
  showClose: true,
  size: 'md',
  visible: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit'): void;
}>();

function onClose() {
  if (props.showClose && !props.disabled) {
    emit('close');
  }
}

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-[320px]';
    case 'lg':
      return 'w-[640px]';
    case 'xl':
      return 'w-[800px]';

    case 'md':
    default:
      return 'w-[480px]';
  }
});
</script>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
</style>
