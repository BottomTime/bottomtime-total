<template>
  <form id="form-signup" class="box" @submit.prevent="onSubmit">
    <FormField label="Username" control-id="username" required>
      <TextBox
        id="username"
        v-model.trim="v$.username.$model"
        :errors="v$.username.$errors"
        placeholder="Jonny123"
      />
      <span class="help"
        >May contain letters, numbers, underscores, dashes, and dots.</span
      >
    </FormField>

    <FormField label="Display Name" control-id="name">
      <TextBox
        id="name"
        v-model.trim="v$.name.$model"
        placeholder="John Smith"
      />
      <span class="help">How your name will appear on the site.</span>
    </FormField>

    <FormField label="Email" control-id="email" required>
      <TextBox
        id="email"
        v-model.trim="v$.email.$model"
        :errors="v$.email.$errors"
        placeholder="johnsmith@gmail.com"
      />
    </FormField>

    <FormField label="Password" control-id="password" required>
      <TextBox
        id="password"
        v-model="v$.password.$model"
        :errors="v$.password.$errors"
        password
      />
      <span class="icon-text help block">
        <span v-if="showPasswordHelp" class="icon is-small">
          <i class="fas fa-chevron-down fa-sm"></i>
        </span>
        <span v-else class="icon is-small">
          <i class="fas fa-chevron-right fa-sm"></i>
        </span>
        <span>
          <a
            id="btn-toggle-password-help"
            :alt="showPasswordHelpMessage"
            @click="togglePasswordHelp"
            >{{ showPasswordHelpMessage }}</a
          >
        </span>
      </span>
      <PasswordStrengthRequirements v-show="showPasswordHelp" />
    </FormField>

    <FormField label="Confirm password" control-id="confirmPassword" required>
      <TextBox
        id="confirmPassword"
        v-model="v$.confirmPassword.$model"
        :errors="v$.confirmPassword.$errors"
        password
      />
    </FormField>

    <div class="field is-grouped is-grouped-centered">
      <button id="btn-signup" class="button is-primary" @click="onSubmit">
        Create Account
      </button>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { email, helpers, required } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';

import { Dispatch, useStore } from '@/store';
import FormField from '@/components/forms/FormField.vue';
import { inject, Toast, ToastType } from '@/helpers';
import { PasswordStrengthRegex, UsernameRegex } from '@/constants';
import PasswordStrengthRequirements from './PasswordStrengthRequirements.vue';
import router from '@/router';
import TextBox from '@/components/forms/TextBox.vue';
import { UserManagerKey, WithErrorHandlingKey } from '@/injection-keys';

interface SignupFormData {
  username: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SuccessToast: Toast = {
  id: 'account-created',
  type: ToastType.Success,
  message: 'Your new account has been created!',
} as const;

const store = useStore();
const userManager = inject(UserManagerKey);
const withErrorHandling = inject(WithErrorHandlingKey);

const showPasswordHelp = ref(false);
const showPasswordHelpMessage = computed(() =>
  showPasswordHelp.value
    ? 'Hide password strength requirements.'
    : 'Show password strength requirements.',
);
const data = reactive<SignupFormData>({
  username: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});
const validation = {
  username: {
    username: helpers.withMessage(
      'Username can only contain letters, numbers, underscores, dots, and dashes.',
      helpers.regex(UsernameRegex),
    ),
    required: helpers.withMessage('Username is required.', required),
  },
  name: {},
  email: {
    email: helpers.withMessage('Email address is invalid.', email),
    required: helpers.withMessage('Email address is required.', required),
  },
  password: {
    strength: helpers.withMessage(
      'Password does not meet strength requirements.',
      helpers.regex(PasswordStrengthRegex),
    ),
    required: helpers.withMessage('Password is required.', required),
  },
  confirmPassword: {
    required: helpers.withMessage('Please confirm your password.', required),
    matches: helpers.withMessage(
      'Passwords must match.',
      (value) => value === data.password,
    ),
  },
};
const v$ = useVuelidate(validation, data);

async function onSubmit() {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  await withErrorHandling(
    async () => {
      const user = await userManager.createUser({
        username: data.username,
        email: data.email,
        password: data.password,
      });

      await store.dispatch(Dispatch.SignInUser, user);
      await store.dispatch(Dispatch.Toast, SuccessToast);
      await router.push('/');
    },
    {
      [409]: async (error) => {
        const { conflictingField } = error.response?.body.details;
        let description: string | undefined;

        if (conflictingField === 'username') {
          description = 'Username is already taken. Please choose another one.';
        } else if (conflictingField === 'email') {
          description =
            'Email address is already in use. Do you already have an account? Try logging in or resetting your password.';
        }

        const toast: Toast = {
          id: 'create-account-failed',
          type: ToastType.Error,
          message: 'Unable to create new account',
          description,
        };
        await store.dispatch(Dispatch.Toast, toast);
      },
    },
  );
}

function togglePasswordHelp() {
  showPasswordHelp.value = !showPasswordHelp.value;
}
</script>
