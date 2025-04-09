<template>
  <ConfirmDialog
    :visible="showConfirmNavigate"
    title="Confirm Navigation"
    confirm-text="Yes, Navigate"
    cancel-text="Cancel"
    @confirm="onConfirm"
    @cancel="onCancel"
  >
    <p>
      You have unsaved changes. Are you sure you want to navigate away? Your
      changes will be lost.
    </p>
  </ConfirmDialog>
  <Transition name="slide-up">
    <div
      v-if="isDirty"
      class="w-full fixed left-0 bottom-0 font-bold text-lg"
      data-testid="save-warning"
    >
      <div
        class="bg-warn-dark container mx-auto rounded-t-lg px-3 py-1 flex justify-between items-baseline shadow-md shadow-grey-800/60"
      >
        <p>Your changes have not yet been saved!</p>
        <FormButton
          control-id="btn-save-warning-save"
          test-id="btn-save-warning-save"
          :is-loading="isSaving"
          @click="$emit('save')"
        >
          Save Changes
        </FormButton>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouteLocationNormalized, useRouter } from 'vue-router';

import {
  CanNavigateGuard,
  useNavigationObserver,
} from '../../navigation-observer';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import FormButton from './form-button.vue';

const navigationObserver = useNavigationObserver();
const router = useRouter();

const props = withDefaults(
  defineProps<{
    isDirty: boolean;
    isSaving?: boolean;
    onNavigation?: CanNavigateGuard;
  }>(),
  {
    isSaving: false,
  },
);
defineEmits<{
  (e: 'save'): void;
}>();
const navigateTo = ref<string | null>(null);
const showConfirmNavigate = ref<boolean>(false);

function defaultOnNavigate(to: RouteLocationNormalized): boolean {
  if (props.isDirty) {
    navigateTo.value = to.fullPath;
    showConfirmNavigate.value = true;
    return false;
  }

  return true;
}

async function onConfirm(): Promise<void> {
  navigationObserver.unsubscribe(props.onNavigation ?? defaultOnNavigate);
  showConfirmNavigate.value = false;
  if (navigateTo.value) {
    await router.push(navigateTo.value);
  }
}

function onCancel() {
  navigateTo.value = null;
  showConfirmNavigate.value = false;
}

// Register guard on mount.
onMounted(() => {
  navigationObserver.subscribe(props.onNavigation ?? defaultOnNavigate);
});

// Deregister guard on unmount.
onBeforeUnmount(() => {
  navigationObserver.unsubscribe(props.onNavigation ?? defaultOnNavigate);
});

// If guard is changed, unsubscribe the old guard and subscribe the new guard.
watch(
  () => props.onNavigation,
  (newGuard, oldGuard) => {
    navigationObserver.unsubscribe(oldGuard ?? defaultOnNavigate);
    navigationObserver.subscribe(newGuard ?? defaultOnNavigate);
  },
);
</script>

<style lang="css" scoped>
.slide-up-enter-active {
  transition: all 0.3s ease-out;
}

.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
