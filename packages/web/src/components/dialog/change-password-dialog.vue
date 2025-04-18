<template>
  <DialogBase
    :title="title"
    :visible="visible"
    :show-close="!isWorking"
    @close="$emit('cancel')"
  >
    <template #default>
      <p v-if="requireOldPassword" class="mb-3">
        To change your password, you must provide your current password and then
        enter your new password twice to confirm it.
      </p>
      <PasswordRequirements class="mb-4" />
      <FormField
        v-if="requireOldPassword"
        control-id="oldPassword"
        label="Old password"
        :invalid="v$.oldPassword.$error"
        :error="v$.oldPassword.$errors[0]?.$message"
        required
      >
        <FormTextBox
          ref="oldPasswordInput"
          v-model="data.oldPassword"
          control-id="oldPassword"
          :maxlength="50"
          test-id="oldPassword"
          :autofocus="requireOldPassword"
          :invalid="v$.oldPassword.$error"
          password
        />
      </FormField>

      <FormField
        control-id="newPassword"
        label="New password"
        :invalid="v$.newPassword.$error"
        :error="v$.newPassword.$errors[0]?.$message"
        required
      >
        <div class="relative">
          <FormTextBox
            ref="newPasswordInput"
            v-model="data.newPassword"
            control-id="newPassword"
            :maxlength="50"
            test-id="newPassword"
            :invalid="v$.newPassword.$error"
            :autofocus="!requireOldPassword"
            :password="!state.showPassword"
          />

          <button
            class="absolute inset-y-0 end-0 rounded-r-lg border border-grey-950 w-8 flex justify-center items-center text-grey-950 disabled:text-grey-500 bg-secondary hover:bg-secondary-hover"
            @click.prevent="onToggleShowPassword"
          >
            <div
              class="dark:text-grey-950"
              :aria-label="
                state.showPassword ? 'hide password' : 'show password'
              "
              data-testid="toggle-show-password"
            >
              <span v-if="state.showPassword">
                <i class="fas fa-eye-slash"></i>
              </span>
              <span v-else>
                <i class="fas fa-eye"></i>
              </span>
            </div>
          </button>
        </div>
      </FormField>

      <FormField
        v-if="!state.showPassword"
        control-id="confirmPassword"
        label="Confirm password"
        :invalid="v$.confirmPassword.$error"
        :error="v$.confirmPassword.$errors[0]?.$message"
        required
      >
        <FormTextBox
          v-model="data.confirmPassword"
          control-id="confirmPassword"
          :maxlength="50"
          test-id="confirmPassword"
          password
        />
      </FormField>
    </template>
    <template #buttons>
      <FormButton
        type="primary"
        :is-loading="isWorking"
        submit
        data-testid="confirm-change-password"
        @click="onConfirm"
      >
        Change Password
      </FormButton>
      <FormButton
        :disabled="isWorking"
        data-testid="cancel-change-password"
        @click="$emit('cancel')"
      >
        Cancel
      </FormButton>
    </template>
  </DialogBase>
</template>

<script lang="ts" setup>
import { PasswordStrengthRegex } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, required, requiredIf } from '@vuelidate/validators';

import { reactive, ref } from 'vue';

import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';
import PasswordRequirements from '../users/password-requirements.vue';
import DialogBase from './dialog-base.vue';

type ChangePasswordDialogProps = {
  isWorking?: boolean;
  requireOldPassword?: boolean;
  showPassword?: boolean;
  title?: string;
  visible?: boolean;
};

type ChangePasswordDialogState = {
  showPassword: boolean;
};

type FormData = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const props = withDefaults(defineProps<ChangePasswordDialogProps>(), {
  isWorking: false,
  requireOldPassword: true,
  showPassword: false,
  title: 'Change Password',
});

const state = reactive<ChangePasswordDialogState>({
  showPassword: props.showPassword,
});

const data = reactive<FormData>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const oldPasswordInput = ref<InstanceType<typeof FormTextBox> | null>(null);
const newPasswordInput = ref<InstanceType<typeof FormTextBox> | null>(null);

const v$ = useVuelidate(
  {
    oldPassword: {
      required: helpers.withMessage(
        'Old password is required',
        requiredIf(props.requireOldPassword),
      ),
    },
    newPassword: {
      required: helpers.withMessage('New password is required', required),
      strength: helpers.withMessage(
        'New password must meet strength requirements',
        helpers.regex(PasswordStrengthRegex),
      ),
    },
    confirmPassword: {
      required: helpers.withMessage(
        'Please confirm the new password',
        requiredIf(() => !state.showPassword),
      ),
      match: helpers.withMessage(
        'Passwords do not match',
        (value) => state.showPassword || value === data.newPassword,
      ),
    },
  },
  data,
);

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'confirm', newPassword: string, oldPassword?: string): void;
}>();

async function onConfirm(): Promise<void> {
  const isValid = await v$.value.$validate();

  if (isValid) {
    emit(
      'confirm',
      data.newPassword,
      props.requireOldPassword ? data.oldPassword : undefined,
    );
  }
}

function onToggleShowPassword() {
  state.showPassword = !state.showPassword;
  newPasswordInput.value?.focus();
}

function reset() {
  data.oldPassword = '';
  data.newPassword = '';
  data.confirmPassword = '';
  v$.value.$reset();
  state.showPassword = props.showPassword;
  oldPasswordInput.value?.focus();
}

function clearOldPassword() {
  data.oldPassword = '';
  v$.value.oldPassword.$reset();
  oldPasswordInput.value?.focus();
}

defineExpose({ clearOldPassword, reset });
</script>
