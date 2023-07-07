<template>
  <form id="form-change-password" class="box" @submit.prevent="() => {}">
    <FormField label="Old Password" control-id="oldPassword" required>
      <TextBox
        id="oldPassword"
        ref="oldPasswordInput"
        :maxlength="50"
        password
        autofocus
        v-model="data.oldPassword"
        :errors="v$.oldPassword.$errors"
      />
    </FormField>

    <FormField label="New Password" control-id="newPassword" required>
      <TextBox
        id="newPassword"
        :maxlength="50"
        password
        v-model="data.newPassword"
        :errors="v$.newPassword.$errors"
      />
    </FormField>

    <FormField label="Confirm Password" control-id="confirmPassword" required>
      <TextBox
        id="confirmPassword"
        :maxlength="50"
        password
        v-model="data.confirmPassword"
        :errors="v$.confirmPassword.$errors"
      />
    </FormField>

    <div class="buttons is-centered">
      <button
        :class="buttonClasses"
        :disabled="passwordChanging"
        @click="changePassword"
      >
        Change Password
      </button>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { helpers, required } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';

import FormField from '@/components/forms/FormField.vue';
import { Toast, ToastType, inject } from '@/helpers';
import TextBox from '@/components/forms/TextBox.vue';
import { PasswordStrengthRegex } from '@/constants';
import { WithErrorHandlingKey } from '@/injection-keys';
import { Dispatch, useStore } from '@/store';

interface ChangePasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SuccessToast: Toast = {
  id: 'password-changed',
  type: ToastType.Success,
  message: 'Your password has been changed.',
};
const OldPasswordIncorrectToast: Toast = {
  id: 'old-password-incorrect',
  type: ToastType.Info,
  message: 'Password could not be changed.',
  description: 'Your old password was incorrect. Please update and try again.',
};

const store = useStore();
const withErrorHandling = inject(WithErrorHandlingKey);

const oldPasswordInput = ref<InstanceType<typeof TextBox> | null>();
const data = reactive<ChangePasswordFormData>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const passwordChanging = ref(false);
const buttonClasses = computed(() => ({
  button: true,
  'is-primary': true,
  'is-loading': passwordChanging.value,
}));

const validations = {
  oldPassword: {
    required: helpers.withMessage('Old password is required.', required),
  },
  newPassword: {
    required: helpers.withMessage('New password is required.', required),
    strength: helpers.withMessage(
      'New password does not meet strength requirements',
      helpers.regex(PasswordStrengthRegex),
    ),
  },
  confirmPassword: {
    required: helpers.withMessage('Please confirm your new password', required),
    match: helpers.withMessage(
      'Passwords do not match',
      (value) => value === data.newPassword,
    ),
  },
};
const v$ = useVuelidate(validations, data);

async function changePassword() {
  const isValid = await v$.value.$validate();
  const user = store.state.currentUser;
  if (!isValid || !user) return;

  passwordChanging.value = true;
  await withErrorHandling(
    async () => {
      await user.changePassword(data.oldPassword, data.newPassword);
      data.oldPassword = data.newPassword = data.confirmPassword = '';
      await store.dispatch(Dispatch.Toast, SuccessToast);
    },
    {
      [400]: async () => {
        data.oldPassword = '';
        oldPasswordInput.value?.focus();
        await store.dispatch(Dispatch.Toast, OldPasswordIncorrectToast);
      },
    },
  );
  passwordChanging.value = false;
}
</script>
