<template>
  <Teleport to="#drawer">
    <!-- Blurred backgroud - covers entire viewport. -->
    <Transition name="backdrop">
      <div
        v-if="visible"
        class="fixed top-0 left-0 w-full h-full backdrop-blur-sm z-[30]"
        data-testid="drawer-backdrop"
        @click="onClose"
      ></div>
    </Transition>

    <!-- Drawer panel. Right half of the screen on most displays; full screen on mobile. -->
    <Transition name="drawer">
      <div
        v-if="visible"
        class="fixed box-border right-0 top-16 pb-20 md:w-1/2 w-full h-full font-content flex flex-col gap-6 bg-grey-200 text-grey-900 dark:bg-grey-900 dark:text-grey-100 drop-shadow-md md:rounded-l-md opacity-100 z-[35] p-4"
        data-testid="drawer-panel"
      >
        <!-- Title and close button. -->
        <div
          v-if="title || showClose"
          class="flex flex-initial flex-row gap-3 items-center"
          data-testid="drawer-title"
        >
          <p class="font-title dark:text-blue-200 text-4xl grow capitalize">
            {{ title }}
          </p>
          <a
            v-if="fullScreen"
            :href="fullScreen"
            data-testid="drawer-fullscreen"
            aria-label="Open panel full screen"
          >
            <button>
              <span
                class="text-grey-100 hover:text-grey-400 dark:text-grey-200 hover:dark:text-grey-500"
              >
                <i class="fas fa-expand-alt"></i>
              </span>
            </button>
          </a>
          <CloseButton
            v-if="showClose"
            data-testid="drawer-close"
            @close="onClose"
          />
        </div>

        <!-- Content. -->
        <div
          class="grow overflow-y-auto overflow-x-hidden"
          data-testid="drawer-content"
        >
          <slot></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import CloseButton from './close-button.vue';

type DrawerPanelProps = {
  fullScreen?: string;
  title?: string;
  showClose?: boolean;
  visible?: boolean;
};

const props = withDefaults(defineProps<DrawerPanelProps>(), {
  showClose: true,
  visible: false,
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
