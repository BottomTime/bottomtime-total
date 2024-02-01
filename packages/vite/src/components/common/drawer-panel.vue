<template>
  <!-- Blurred backgroud - covers entire viewport. -->
  <Transition name="backdrop">
    <div
      v-if="visible"
      class="absolute top-0 left-0 w-full h-full backdrop-blur-sm z-30"
      data-testid="drawer-backdrop"
      @click="onClose"
    ></div>
  </Transition>
  <Transition name="drawer">
    <!-- Drawer panel. Right half of the screen on most displays; full screen on mobile. -->
    <div
      v-if="visible"
      class="fixed right-0 top-16 md:w-1/2 w-full h-full font-content bg-grey-200 text-grey-900 dark:bg-grey-900 dark:text-grey-100 drop-shadow-md md:rounded-l-md opacity-90 z-40 p-4"
    >
      <!-- Title and close button. -->
      <div v-if="title || showClose" class="flex flex-row mb-6 w-full">
        <p class="font-title dark:text-blue-200 text-4xl grow">
          {{ title }}
        </p>
        <CloseButton
          v-if="showClose"
          data-testid="drawer-close"
          @close="onClose"
        />
      </div>

      <!-- Content. -->
      <slot></slot>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import CloseButton from './close-button.vue';

type DrawerPanelProps = {
  title?: string;
  showClose?: boolean;
  visible?: boolean;
};

const props = withDefaults(defineProps<DrawerPanelProps>(), {
  showClose: true,
  visible: true,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function onClose() {
  if (props.showClose) emit('close');
}
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.5s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
</style>
