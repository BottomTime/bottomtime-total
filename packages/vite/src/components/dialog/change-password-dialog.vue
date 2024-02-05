<template>
  <DialogBase
    :title="title"
    :visible="visible"
    :show-close="false"
    @close="$emit('cancel')"
  >
    <template #default>
      <form @submit.prevent=""></form>
    </template>
    <template #buttons>
      <FormButton
        type="primary"
        :is-loading="isWorking"
        @click="$emit('confirm', '')"
      >
        Change Password
      </FormButton>
      <FormButton :disabled="isWorking" @click="$emit('cancel')">
        Cancel
      </FormButton>
    </template>
  </DialogBase>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';

import FormButton from '../common/form-button.vue';
import DialogBase from './dialog-base.vue';

type ChangePasswordDialogProps = {
  isWorking?: boolean;
  requireOldPassword?: boolean;
  showPassword?: boolean;
  title?: string;
  visible: boolean;
};

type ChangePasswordDialogState = {
  showPassword: boolean;
};

const props = withDefaults(defineProps<ChangePasswordDialogProps>(), {
  isWorking: false,
  requireOldPassword: true,
  showPassword: false,
  title: 'Change Password',
  visible: false,
});
const state = reactive<ChangePasswordDialogState>({
  showPassword: props.showPassword,
});

defineEmits<{
  (e: 'cancel'): void;
  (e: 'confirm', newPassword: string, oldPassword?: string): void;
}>();
</script>
