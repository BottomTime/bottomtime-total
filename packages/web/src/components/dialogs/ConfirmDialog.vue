<template>
  <div v-if="visible" class="modal is-active">
    <div class="modal-background" @click="onCancel"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ title }}</p>
        <button class="delete" aria-label="close" @click="onCancel"></button>
      </header>
      <section class="modal-card-body">
        <slot></slot>
      </section>
      <footer class="modal-card-foot has-text-right">
        <div class="field is-grouped is-grouped-right">
          <div class="control">
            <button :class="confirmButtonClasses" @click="onConfirm">
              {{ confirmText }}
            </button>
          </div>
          <div class="control">
            <button class="button dialog-cancel" @click="onCancel">
              {{ cancelText }}
            </button>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface ConfirmDialogProps {
  cancelText?: string;
  confirmText?: string;
  dangerous?: boolean;
  title?: string;
  visible?: boolean;
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  cancelText: 'Cancel',
  confirmText: 'Confirm',
  dangerous: false,
  title: 'Confirm?',
  visible: false,
});
const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'confirm'): void;
}>();

const confirmButtonClasses = computed(
  () => `button dialog-confirm ${props.dangerous ? 'is-danger' : 'is-primary'}`,
);

function onCancel() {
  emit('cancel');
}

function onConfirm() {
  emit('confirm');
}
</script>
