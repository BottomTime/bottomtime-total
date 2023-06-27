<template>
  <form id="form-signup" class="box" @submit.prevent="() => {}">
    <FormField label="Username" control-id="username" required>
      <TextBox
        id="username"
        v-model.trim="data.username"
        :errors="v$.username.$errors"
        :maxlength="50"
      />
      <span class="help"
        >May contain letters, numbers, underscores, dashes, and dots.</span
      >
    </FormField>

    <FormField label="Email" control-id="email" required>
      <TextBox
        id="email"
        v-model.trim="data.email"
        :errors="v$.email.$errors"
        :maxlength="50"
      />
    </FormField>

    <FormField
      label="Profile Visibility"
      control-id="profileVisibility"
      required
    >
      <DropDown
        id="profileVisibility"
        v-model="data.profileVisibility"
        :options="ProfileVisibilityOptions"
      />
      <span class="help"
        >Who will be allowed to view your profile information?</span
      >
    </FormField>

    <FormField label="Password" control-id="password" required>
      <TextBox
        id="password"
        v-model="data.password"
        :errors="v$.password.$errors"
        :maxlength="50"
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
        v-model="data.confirmPassword"
        :errors="v$.confirmPassword.$errors"
        :maxlength="50"
        password
      />
    </FormField>

    <FormField label="Display Name" control-id="name">
      <TextBox id="name" v-model.trim="data.name" :maxlength="100" />
      <span class="help">How your name will appear on the site.</span>
    </FormField>

    <FormField label="Location" control-id="location">
      <TextBox id="location" v-model.trim="data.location" :maxlength="50" />
      <span class="help"
        >Your general location in the world (i.e. city or region)</span
      >
    </FormField>

    <div class="field is-grouped is-grouped-centered">
      <button id="btn-signup" class="button is-primary" @click="submit">
        Create Account
      </button>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { defineExpose, computed, reactive, ref } from 'vue';
import { email, helpers, required } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';

import { Dispatch, useStore } from '@/store';
import DropDown from '@/components/forms/DropDown.vue';
import FormField from '@/components/forms/FormField.vue';
import { inject, Toast, ToastType } from '@/helpers';
import {
  EmailRegex,
  PasswordStrengthRegex,
  ProfileVisibility,
  ProfileVisibilityOptions,
  UsernameRegex,
} from '@/constants';
import PasswordStrengthRequirements from './PasswordStrengthRequirements.vue';
import router from '@/router';
import TextBox from '@/components/forms/TextBox.vue';
import { UserManagerKey, WithErrorHandlingKey } from '@/injection-keys';

interface SignupFormData {
  username: string;
  email: string;
  profileVisibility: string;
  name: string;
  location: string;
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
  email: '',
  profileVisibility: ProfileVisibility.FriendsOnly,
  name: '',
  location: '',
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
    conflicted: helpers.withMessage(
      'Username is taken.',
      helpers.withAsync(async (username: string) => {
        if (username.length < 3) return true;
        if (!UsernameRegex.test(username)) return true;
        return await userManager.isUsernameOrEmailAvailable(username);
      }),
    ),
  },
  email: {
    email: helpers.withMessage('Email address is invalid.', email),
    required: helpers.withMessage('Email address is required.', required),
    conflicted: helpers.withMessage(
      'Email is already taken. Do you already have an account setup with us?',
      helpers.withAsync(async (email: string) => {
        if (email.length < 3) return true;
        if (!EmailRegex.test(email)) return true;
        return await userManager.isUsernameOrEmailAvailable(email);
      }),
    ),
  },
  profileVisibility: {},
  name: {},
  location: {},
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
const v$ = useVuelidate(validation, data, { $lazy: true });

async function submit() {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  await withErrorHandling(
    async (): Promise<void> => {
      const user = await userManager.createUser({
        username: data.username,
        email: data.email,
        password: data.password,
        profile: {
          name: data.name,
          location: data.location,
          profileVisibility: data.profileVisibility,
        },
      });

      await store.dispatch(Dispatch.SignInUser, user);
      await store.dispatch(Dispatch.Toast, SuccessToast);
      await router.push('/');
    },
    {
      [409]: async (error): Promise<void> => {
        const conflictingField =
          error.response?.body?.details?.conflictingField;
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

defineExpose({
  submit,
});
</script>
