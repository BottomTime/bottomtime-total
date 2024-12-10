<template>
  <div class="grid grid-cols-1 lg:grid-cols-5">
    <FormBox
      class="col-start-1 col-span-1 lg:col-start-2 lg:col-span-3 space-y-6"
    >
      <div
        v-if="resetState === PasswordResetTokenStatus.Valid"
        class="space-y-6"
        data-testid="reset-success-message"
      >
        <div class="flex gap-4 text-success text-xl items-start justify-center">
          <div class="mt-3">
            <i class="fa-regular fa-circle-check fa-xl"></i>
          </div>

          <p>
            Your password has been reset. You may now use your new password to
            log into the site.
          </p>
        </div>

        <LoginForm :username="username" redirect-to="/" />
      </div>

      <div
        v-else-if="
          resetState === PasswordResetTokenStatus.Invalid ||
          resetState === PasswordResetTokenStatus.Expired
        "
        class="space-y-6"
        data-testid="reset-failed-message"
      >
        <div class="flex gap-4 text-danger text-xl items-start justify-center">
          <div class="mt-3">
            <i class="fa-regular fa-circle-xmark fa-xl"></i>
          </div>

          <div class="space-y-4 italic">
            <p>
              Your password could not be reset. Your reset token is invalid or
              expired.
            </p>

            <p>
              If you think this is an error, you can go
              <RouterLink to="/resetPassword">back here</RouterLink> and try
              requesting a new token.
            </p>

            <p>
              If you are still stuck, you can try contacting an
              <a :href="`mailto:${Config.adminEmail}`">administrator</a>
              for help.
            </p>
          </div>
        </div>
      </div>

      <form
        v-else
        class="space-y-6"
        data-testid="reset-password-form"
        @submit.prevent="onSubmit"
      >
        <p class="text-lg text-center font-bold text-success space-x-3">
          <span>
            <i class="fa-regular fa-circle-check fa-lg"></i>
          </span>
          <span>Your reset token has been validated</span>
        </p>
        <p class="text-justify">
          Enter a new password for your account below. Once your password is
          reset, you will be prompted to log in with your new password.
        </p>

        <fieldset class="space-y-6" :disabled="isLoading">
          <FormField
            label="New password"
            control-id="password"
            :invalid="v$.newPassword.$error"
            :error="v$.newPassword.$errors[0]?.$message"
            required
          >
            <FormTextBox
              v-model.trim="state.newPassword"
              test-id="password"
              control-id="password"
              type="password"
              :maxlength="50"
              :invalid="v$.newPassword.$error"
              password
              autofocus
            />
          </FormField>

          <FormField
            label="Confirm password"
            control-id="confirmPassword"
            :invalid="v$.confirmPassword.$error"
            :error="v$.confirmPassword.$errors[0]?.$message"
            required
          >
            <FormTextBox
              v-model.trim="state.confirmPassword"
              control-id="confirmPassword"
              test-id="confirm-password"
              type="password"
              :maxlength="50"
              :invalid="v$.confirmPassword.$error"
              password
            />
          </FormField>

          <PasswordRequirements />

          <div class="text-center">
            <FormButton
              type="primary"
              submit
              control-id="resetPassword"
              test-id="reset-password-submit"
              :is-loading="isLoading"
              @click="onSubmit"
            >
              Reset Password
            </FormButton>
          </div>
        </fieldset>
      </form>
    </FormBox>
  </div>
</template>

<script lang="ts" setup>
import {
  PasswordResetTokenStatus,
  PasswordStrengthRegex,
} from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import { reactive } from 'vue';
import { RouterLink } from 'vue-router';

import { Config } from '../../config';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';
import LoginForm from './login-form.vue';
import PasswordRequirements from './password-requirements.vue';

interface ResetPasswordProps {
  isLoading?: boolean;
  resetState?: PasswordResetTokenStatus;
  token: string;
  username: string;
}

interface ResetPasswordState {
  newPassword: string;
  confirmPassword: string;
}

withDefaults(defineProps<ResetPasswordProps>(), { isLoading: false });
const emit = defineEmits<{
  (e: 'reset-password', newPassword: string): void;
}>();
const state = reactive<ResetPasswordState>({
  newPassword: '',
  confirmPassword: '',
});

const v$ = useVuelidate(
  {
    newPassword: {
      required: helpers.withMessage('New password is required', required),
      strength: helpers.withMessage(
        'New password must meet the minimum requirements',
        helpers.regex(PasswordStrengthRegex),
      ),
    },
    confirmPassword: {
      required: helpers.withMessage('Confirm password is required', required),
      sameAsNewPassword: helpers.withMessage(
        'Passwords do not match',
        (value: string) => value === state.newPassword,
      ),
    },
  },
  state,
);

async function onSubmit(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (isValid) emit('reset-password', state.newPassword);
}
</script>
