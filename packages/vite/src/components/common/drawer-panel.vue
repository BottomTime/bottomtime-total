<template>
  <!-- Blurred backgroud - covers entire viewport. -->
  <Transition name="backdrop">
    <div
      v-show="visible"
      class="absolute top-0 left-0 w-full h-full backdrop-blur-sm z-30"
      @click="$emit('close')"
    ></div>
  </Transition>
  <Transition name="drawer">
    <!-- Drawer panel. Right half of the screen on most displays; full screen on mobile. -->
    <div
      v-show="visible"
      class="fixed right-0 top-16 md:w-1/2 w-full h-full bg-grey-200 drop-shadow-md md:rounded-l-md opacity-90 z-40 p-4"
    >
      <!-- Title and close button. -->
      <div v-if="title || showClose" class="flex flex-row mb-6 w-full">
        <p class="font-title text-4xl grow">
          {{ title }}
        </p>
        <CloseButton v-if="showClose" @close="$emit('close')" />
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

withDefaults(defineProps<DrawerPanelProps>(), {
  showClose: true,
  visible: true,
});

defineEmits<{
  (e: 'close'): void;
}>();
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
