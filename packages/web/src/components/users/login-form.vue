<template>
  <form data-testid="login-form" @submit.prevent>
    <FormField
      label="Username or email"
      control-id="username"
      :invalid="v$.usernameOrEmail.$error"
      :error="v$.usernameOrEmail.$errors[0]?.$message"
      required
    >
      <FormTextBox
        ref="usernameTextBox"
        v-model.trim="loginDetails.usernameOrEmail"
        :autofocus="!username"
        control-id="username"
        :maxlength="50"
        :invalid="v$.usernameOrEmail.$error"
        test-id="login-username"
      />
    </FormField>

    <FormField
      control-id="password"
      label="Password"
      :invalid="v$.password.$error"
      :error="v$.password.$errors[0]?.$message"
      required
    >
      <FormTextBox
        ref="passwordTextBox"
        v-model="loginDetails.password"
        :autofocus="!!username"
        control-id="password"
        :maxlength="50"
        :invalid="v$.password.$error"
        test-id="login-password"
        password
      />
    </FormField>

    <div class="flex flex-row justify-center gap-3 mt-2 mb-6">
      <FormButton
        type="primary"
        test-id="login-submit"
        :is-loading="isLoading"
        submit
        @click="login"
      >
        Sign in
      </FormButton>
      <FormButton v-if="showCancel" @click="$emit('close')">Cancel</FormButton>
    </div>
    <div class="text-center mb-6">
      Forgot your username or password? No problem!
      <NavLink to="/resetPassword" @click="$emit('close')">
        Recover them here </NavLink
      >.
    </div>

    <hr />

    <div>
      <p class="m-6 text-center">
        Alternatively, you can sign in using one of these providers:
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3">
        <div class="md:col-start-2 flex flex-col gap-4">
          <a
            v-for="provider in oAuthProviders"
            :key="provider.name"
            :href="provider.url"
          >
            <FormButton stretch>
              <span>
                <i :class="provider.icon"></i>
                Sign in with {{ provider.name }}
              </span>
            </FormButton>
          </a>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { LoginParamsDTO, UserDTO } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { Toast, ToastType } from '../../common';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';
import NavLink from '../common/nav-link.vue';

type LoginFormProps = {
  redirectTo?: string;
  showCancel?: boolean;
  username?: string;
};

type OAuthProvider = {
  name: string;
  url: string;
  icon: string;
};

const oAuthProviders: Readonly<OAuthProvider[]> = [
  {
    name: 'Google',
    url: '/api/auth/google',
    icon: 'fa-brands fa-google',
  },
  {
    name: 'Discord',
    url: '/api/auth/discord',
    icon: 'fa-brands fa-discord',
  },
  {
    name: 'Github',
    url: '/api/auth/github',
    icon: 'fa-brands fa-github',
  },
];

const currentUser = useCurrentUser();
const client = useClient();
const oops = useOops();
const router = useRouter();
const toasts = useToasts();

const props = withDefaults(defineProps<LoginFormProps>(), {
  showCancel: true,
});
const loginDetails = reactive<LoginParamsDTO>({
  usernameOrEmail: props.username || '',
  password: '',
});
const v$ = useVuelidate(
  {
    usernameOrEmail: {
      required: helpers.withMessage('Username or email is required.', required),
    },
    password: {
      required: helpers.withMessage('Password is required.', required),
    },
  },
  loginDetails,
);

const usernameTextBox = ref<InstanceType<typeof FormTextBox> | null>();
const passwordTextBox = ref<InstanceType<typeof FormTextBox> | null>();
const isLoading = ref(false);
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'login', user: UserDTO): void;
}>();
const LoginAttemptFailedToast: Toast = {
  id: 'login-attempt-failed',
  message: 'Login attempt failed. Please check your password and try again.',
  type: ToastType.Error,
};

/**
 * Resets the login form by clearing the text boxes.
 * @param fullForm
 * If true, both the username and password text boxes will be cleared. Otherwise, only the password will be cleared.
 * Defaults to false.
 */
function reset(fullForm = false): void {
  if (fullForm) loginDetails.usernameOrEmail = props.username || '';
  loginDetails.password = '';
  v$.value.$reset();

  if (props.username) passwordTextBox.value?.focus();
  else usernameTextBox.value?.focus();
}

/**
 * Focuses the username text box.
 */
function focusUsername(): void {
  usernameTextBox.value?.focus();
}

/**
 * Focuses the password text box.
 */
function focusPassword(): void {
  passwordTextBox.value?.focus();
}

async function login() {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  isLoading.value = true;
  const user = await oops<UserDTO>(
    () =>
      client.auth.login(loginDetails.usernameOrEmail, loginDetails.password),
    {
      401: () => {
        toasts.toast(LoginAttemptFailedToast);
        reset();
        v$.value.$reset();
        focusPassword();
      },
    },
  );
  isLoading.value = false;

  if (user) {
    currentUser.user = user;
    reset(true);
    emit('close');
    emit('login', user);

    if (props.redirectTo) await router.push(props.redirectTo);
  }
}

onMounted(() => {
  reset(!props.username);
});

defineExpose({ focusUsername, focusPassword, reset });
</script>
