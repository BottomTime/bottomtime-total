<template>
  <DialogBase
    :visible="visible"
    size="sm"
    :title="title"
    @close="$emit('cancel')"
  >
    <template #default>
      <slot></slot>
    </template>

    <template #buttons>
      <FormButton
        :type="dangerous ? 'danger' : 'primary'"
        test-id="dialog-confirm-button"
        @click="$emit('confirm')"
      >
        {{ confirmText }}
      </FormButton>
      <FormButton test-id="dialog-cancel-button" @click="$emit('cancel')">
        {{ cancelText }}
      </FormButton>
    </template>
  </DialogBase>
</template>

<script setup lang="ts">
import FormButton from '../common/form-button.vue';
import DialogBase from './dialog-base.vue';

type ConfirmDialogProps = {
  cancelText?: string;
  confirmText?: string;
  dangerous?: boolean;
  title?: string;
  visible?: boolean;
};

withDefaults(defineProps<ConfirmDialogProps>(), {
  cancelText: 'Cancel',
  confirmText: 'Confirm',
  dangerous: false,
  title: 'Confirm?',
  visible: false,
});
defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>
