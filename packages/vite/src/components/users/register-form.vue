<template>
  <form @submit.prevent>
    <div class="grid grid-cols-1 md:grid-cols-5">
      <div
        class="md:col-start-2 md:col-span-3 flex flex-col bg-blue-100 p-2 rounded-md shadow-md"
      >
        <FormField
          label="Username"
          control-id="username"
          :invalid="v$.username.$error"
          :error="v$.username.$errors[0]?.$message"
          help="Username should contain only letters, numbers, and underscores."
          required
        >
          <FormTextBox
            control-id="username"
            :maxlength="50"
            :invalid="v$.username.$error"
            v-model="registerData.username"
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
            control-id="email"
            :maxlength="50"
            :invalid="v$.email.$error"
            v-model.trim="registerData.email"
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
            control-id="password"
            :maxlength="50"
            :invalid="v$.password.$error"
            v-model="registerData.password"
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
            control-id="confirm-password"
            :maxlength="50"
            :invalid="v$.confirmPassword.$error"
            v-model="registerData.confirmPassword"
            password
          />
        </FormField>

        <FormField
          label="Profile visibility"
          control-id="profile-visibility"
          :invalid="v$.profileVisibility.$error"
          :error="v$.profileVisibility.$errors[0]?.$message"
        >
          <FormSelect> </FormSelect>
        </FormField>

        <FormField
          label="Display name"
          control-id="display-name"
          :invalid="v$.displayName.$error"
          :error="v$.displayName.$errors[0]?.$message"
        >
          <FormTextBox
            control-id="display-name"
            :maxlength="100"
            :invalid="v$.displayName.$error"
            v-model="registerData.displayName"
          />
        </FormField>

        <FormField
          label="Location"
          control-id="location"
          :invalid="v$.location.$error"
          :error="v$.location.$errors[0]?.$message"
        >
          <FormTextBox
            control-id="location"
            :maxlength="50"
            :invalid="v$.location.$error"
            v-model="registerData.location"
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
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { email, helpers, required } from '@vuelidate/validators';
import { reactive } from 'vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextBox from '../common/form-text-box.vue';
import { PasswordStrengthRegex } from '../../../../web/src/constants';

type RegisterData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  profileVisibility: string;
  displayName: string;
  location: string;
};

const registerData = reactive<RegisterData>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  profileVisibility: 'public',
  displayName: '',
  location: '',
});

const v$ = useVuelidate(
  {
    username: {
      required: helpers.withMessage('Username is required', required),
      username: helpers.withMessage(
        'Username should contain only letters, numbers, and underscores',
        helpers.regex('username', /^[a-zA-Z0-9_]+$/),
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
    profileVisibility: {
      required: helpers.withMessage('Profile visibility is required', required),
    },
    confirmPassword: {
      required: helpers.withMessage('Confirm password is required', required),
      sameAsPassword: helpers.withMessage(
        'Confirm password must match password',
        () => registerData.password === registerData.confirmPassword,
      ),
    },
    displayName: {},
    location: {},
  },
  registerData,
);

async function register() {
  await v$.value.$validate();
}
</script>
