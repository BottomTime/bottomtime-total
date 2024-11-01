<template>
  <DialogBase
    :disabled="isLoading"
    :visible="visible"
    :size="size"
    :title="title"
    @close="$emit('cancel')"
  >
    <template #default>
      <div class="flex gap-4">
        <figure class="my-2">
          <i :class="icon"></i>
        </figure>
        <div class="space-y-3">
          <slot></slot>
        </div>
      </div>
    </template>

    <template #buttons>
      <FormButton
        :type="dangerous ? 'danger' : 'primary'"
        :is-loading="isLoading"
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
  icon?: string;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
  visible?: boolean;
};

withDefaults(defineProps<ConfirmDialogProps>(), {
  cancelText: 'Cancel',
  confirmText: 'Confirm',
  dangerous: false,
  icon: 'fa-regular fa-circle-question fa-2x',
  isLoading: false,
  size: 'md',
  title: 'Confirm?',
  visible: false,
});
defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>
