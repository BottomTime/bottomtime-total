<template>
  <ConfirmDialog
    title="Log out?"
    confirm-text="Log out"
    :visible="showConfirmLogout"
    @cancel="showConfirmLogout = false"
    @confirm="onLogout"
  >
    <p class="flex justify-start">
      <span>
        <i class="fas fa-question-circle fa-2x text-blue-400 mr-4"></i>
      </span>
      <span>
        Are you sure you want to log out? This will end your current session.
      </span>
    </p>
  </ConfirmDialog>
  <div class="grid grid-cols-1 md:grid-cols-5">
    <div
      class="md:col-start-2 md:col-span-3 flex flex-col bg-blue-100 p-4 rounded-md shadow-md opacity-100"
    >
      <form v-if="currentUser.anonymous" @submit.prevent>
        <FormField
          label="Username"
          control-id="username"
          :invalid="v$.username.$error"
          :error="v$.username.$errors[0]?.$message"
          help="Username should contain only letters, numbers, and underscores."
          required
        >
          <FormTextBox
            v-model.trim="registerData.username"
            control-id="username"
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
            v-model.trim="registerData.email"
            control-id="email"
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
            v-model="registerData.password"
            control-id="password"
            :maxlength="50"
            :invalid="v$.password.$error"
            password
          />
        </FormField>

        <FormField
          label="Confirm password"
          control-id="confirm-password"
          :invalid="v$.confirmPassword.$error"
          :error="v$.confirmPassword.$errors[0]?.$message"
          required
        >
          <FormTextBox
            v-model="registerData.confirmPassword"
            control-id="confirm-password"
            :maxlength="50"
            :invalid="v$.confirmPassword.$error"
            password
          />
        </FormField>

        <FormField
          label="Profile info visible to"
          control-id="profileVisibility"
          required
        >
          <FormSelect
            v-model="registerData.profileVisibility"
            control-id="profileVisibility"
            :options="ProfileVisibilityOptions"
          />
        </FormField>

        <FormField label="Display name" control-id="display-name">
          <FormTextBox
            v-model.trim="registerData.displayName"
            control-id="display-name"
            :maxlength="100"
          />
        </FormField>

        <FormField label="Location" control-id="location">
          <FormTextBox
            v-model.trim="registerData.location"
            control-id="location"
            :maxlength="50"
          />
        </FormField>

        <span>{{ JSON.stringify(registerData) }}</span>

        <div>
          <FormButton
            type="primary"
            test-id="register-submit"
            :is-loading="false"
            submit
            @click="register"
          >
            Register
          </FormButton>
        </div>
      </form>

      <div v-else class="flex flex-row align-top">
        <span class="text-warn mr-4 mt-2">
          <i class="fas fa-exclamation fa-2x"></i>
        </span>
        <div>
          <p class="mb-3">
            It looks like you are trying to create a new account but you are
            already signed in. If you are here by mistake, try navigating back
            to the
            <NavLink to="/">home page</NavLink> or navigating to where you want
            to be using the nav bar at the top of the page.
          </p>
          <p>
            If you are interested in creating a new account, you must first log
            out and then return to this page. Click
            <NavLink to="#" @click="showConfirmLogout = true">here</NavLink> to
            log out.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PasswordStrengthRegex,
  ProfileVisibility,
  UsernameRegex,
} from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { email, helpers, required } from '@vuelidate/validators';

import { reactive, ref } from 'vue';

import { SelectOption } from '../../common';
import { useCurrentUser } from '../../store';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextBox from '../common/form-text-box.vue';
import NavLink from '../common/nav-link.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';

type RegisterData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  profileVisibility: ProfileVisibility;
  displayName: string;
  location: string;
};

const ProfileVisibilityOptions: SelectOption[] = [
  { label: 'Only my friends', value: ProfileVisibility.FriendsOnly },
  { label: 'Public', value: ProfileVisibility.Public },
  { label: 'Private', value: ProfileVisibility.Private },
];

const currentUser = useCurrentUser();

const registerData = reactive<RegisterData>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  profileVisibility: ProfileVisibility.FriendsOnly,
  displayName: '',
  location: '',
});
const showConfirmLogout = ref(false);

const v$ = useVuelidate(
  {
    username: {
      required: helpers.withMessage('Username is required', required),
      username: helpers.withMessage(
        'Username must contain only letters, numbers, underscores, dots, and dashes',
        helpers.regex(UsernameRegex),
      ),
    },
    email: {
      required: helpers.withMessage('Email address is required', required),
      email: helpers.withMessage(
        'Must be a valid email address (e.g. address@server.org)',
        email,
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
      required: helpers.withMessage('Confirm password is required', required),
      sameAsPassword: helpers.withMessage(
        'Confirm password must match password',
        () => registerData.password === registerData.confirmPassword,
      ),
    },
  },
  registerData,
);

async function register() {
  await v$.value.$validate();
}

function onLogout() {
  location.assign('/api/auth/logout');
}
</script>
