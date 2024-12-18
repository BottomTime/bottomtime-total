<template>
  <div class="grid grid-cols-1 md:grid-cols-5">
    <div
      class="md:col-start-2 md:col-span-3 flex flex-col bg-blue-100 dark:bg-blue-900 p-4 rounded-md shadow-md opacity-100"
    >
      <form @submit.prevent>
        <FormField
          label="Username"
          control-id="username"
          :invalid="v$.username.$error"
          :error="v$.username.$errors[0]?.$message"
          help="Username should contain only letters, numbers, and underscores."
          required
        >
          <FormTextBox
            v-model.trim="data.username"
            control-id="username"
            test-id="username"
            :maxlength="50"
            :invalid="v$.username.$error"
          />
        </FormField>

        <FormField
          label="Email address"
          control-id="email"
          :invalid="v$.email.$error"
          :error="v$.email.$errors[0]?.$message"
          required
        >
          <FormTextBox
            v-model.trim="data.email"
            control-id="email"
            test-id="email"
            :maxlength="50"
            :invalid="v$.email.$error"
          />
        </FormField>

        <FormField
          label="Password"
          control-id="password"
          :invalid="v$.password.$error"
          :error="v$.password.$errors[0]?.$message"
          required
        >
          <FormTextBox
            v-model="data.password"
            control-id="password"
            test-id="password"
            :maxlength="50"
            :invalid="v$.password.$error"
            password
          />
          <PasswordRequirements class="m-1" />
        </FormField>

        <FormField
          label="Confirm password"
          control-id="confirm-password"
          :invalid="v$.confirmPassword.$error"
          :error="v$.confirmPassword.$errors[0]?.$message"
          required
        >
          <FormTextBox
            v-model="data.confirmPassword"
            control-id="confirm-password"
            test-id="confirm-password"
            :maxlength="50"
            :invalid="v$.confirmPassword.$error"
            password
          />
        </FormField>

        <FormField label="Display name" control-id="display-name">
          <FormTextBox
            v-model.trim="data.displayName"
            control-id="display-name"
            test-id="display-name"
            :maxlength="100"
          />
        </FormField>

        <FormField label="Location" control-id="location">
          <FormTextBox
            v-model.trim="data.location"
            control-id="location"
            test-id="location"
            :maxlength="50"
          />
        </FormField>

        <div class="text-center">
          <FormButton
            type="primary"
            test-id="register-submit"
            :is-loading="isLoading"
            submit
            @click="register"
          >
            Register
          </FormButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PasswordStrengthRegex, UsernameRegex } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { email, helpers, required } from '@vuelidate/validators';

import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { ToastType } from '../../common';
import { isErrorResponse, useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';
import PasswordRequirements from './password-requirements.vue';

type RegisterData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  location: string;
};

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const toasts = useToasts();
const router = useRouter();

const data = reactive<RegisterData>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  displayName: '',
  location: '',
});
const isLoading = ref(false);

const v$ = useVuelidate(
  {
    username: {
      required: helpers.withMessage('Username is required', required),
      username: helpers.withMessage(
        'Username must contain only letters, numbers, underscores, dots, and dashes',
        helpers.regex(UsernameRegex),
      ),
      conflict: helpers.withMessage(
        'Username is already taken',
        helpers.withAsync(isUsernameOrEmailAvailable),
      ),
    },
    email: {
      required: helpers.withMessage('Email address is required', required),
      email: helpers.withMessage(
        'Must be a valid email address (e.g. address@server.org)',
        email,
      ),
      conflict: helpers.withMessage(
        'Email address is already in use',
        helpers.withAsync(isUsernameOrEmailAvailable),
      ),
    },
    password: {
      required: helpers.withMessage('Password is required', required),
      strength: helpers.withMessage(
        'Password must meet strength requirements',
        helpers.regex(PasswordStrengthRegex),
      ),
    },
    confirmPassword: {
      required: helpers.withMessage(
        'Password confirmation is required',
        required,
      ),
      sameAsPassword: helpers.withMessage(
        'Passwords do not match',
        (value) => value === data.password,
      ),
    },
  },
  data,
);

async function isUsernameOrEmailAvailable(
  usernameOrEmail: string,
): Promise<boolean> {
  if (usernameOrEmail.length < 3) return true;

  const available = await oops<boolean>(async () => {
    const available = await client.userAccounts.isUsernameOrEmailAvailable(
      usernameOrEmail,
    );
    return available;
  });

  return available ?? false;
}

async function register() {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  isLoading.value = true;
  await oops(
    async () => {
      await client.userAccounts.createUser({
        username: data.username,
        email: data.email,
        password: data.password,
        profile: {
          name: data.displayName,
          location: data.location,
        },
      });
      currentUser.user = await client.auth.login(data.username, data.password);
      router.push('/welcome');
    },
    {
      409: (e) => {
        if (isErrorResponse(e)) {
          toasts.toast({
            id: 'username-or-email-conflict',
            type: ToastType.Error,
            message: e.message,
          });
        }
      },
    },
  );
  isLoading.value = false;
}
</script>
