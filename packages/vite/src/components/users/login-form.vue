<template>
  <form @submit.prevent="login">
    <div class="grid grid-cols-1 md:grid-cols-3">
      <div class="md:col-start-2 flex flex-col">
        <FormField
          label="Username or email"
          :invalid="v$.usernameOrEmail.$error"
          :error="v$.usernameOrEmail.$errors[0]?.$message"
          required
        >
          <FormTextBox
            ref="usernameTextBox"
            :maxlength="50"
            :invalid="v$.usernameOrEmail.$error"
            v-model.trim="loginDetails.usernameOrEmail"
          />
        </FormField>
        <FormField
          label="Password"
          :invalid="v$.password.$error"
          :error="v$.password.$errors[0]?.$message"
          required
        >
          <FormTextBox
            ref="passwordTextBox"
            :maxlength="50"
            :invalid="v$.password.$error"
            v-model.trim="loginDetails.password"
            password
          />
        </FormField>
      </div>
    </div>
    <div class="flex flex-row justify-center gap-3 mt-2 mb-6">
      <FormButton type="primary" :is-loading="isLoading" submit>
        Sign in
      </FormButton>
      <FormButton v-if="showCancel" @click="$emit('close')">Cancel</FormButton>
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
import { LoginParamsDTO } from '@bottomtime/api';
import { useVuelidate } from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';
import { onMounted, reactive, ref } from 'vue';
import { useClient } from '../../client';
import { useCurrentUser, useToasts } from '../../store';
import { useOops } from '../../oops';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';
import { User } from '../../client/user';
import { Toast, ToastType } from '../../common';

type LoginFormProps = {
  showCancel?: boolean;
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
    icon: 'fab fa-google',
  },
  {
    name: 'Discord',
    url: '/api/auth/discord',
    icon: 'fab fa-discord',
  },
  {
    name: 'Github',
    url: '/api/auth/github',
    icon: 'fab fa-github',
  },
];

const currentUser = useCurrentUser();
const client = useClient();
const oops = useOops();
const toasts = useToasts();

const loginDetails = reactive<LoginParamsDTO>({
  usernameOrEmail: '',
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
}>();
const LoginAttemptFailedToast: Toast = {
  id: 'login-attempt-failed',
  message: 'Login attempt failed. Please check your password and try again.',
  type: ToastType.Error,
};

withDefaults(defineProps<LoginFormProps>(), {
  showCancel: true,
});

/**
 * Resets the login form by clearing the text boxes.
 * @param fullForm
 * If true, both the username and password text boxes will be cleared. Otherwise, only the password will be cleared.
 * Defaults to false.
 */
function reset(fullForm = false): void {
  if (fullForm) loginDetails.usernameOrEmail = '';
  loginDetails.password = '';
  v$.value.$reset();
  usernameTextBox.value?.focus();
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
  isLoading.value = true;

  const isValid = await v$.value.$validate();
  if (!isValid) return;

  let user: User | undefined;

  await oops(
    async () => {
      user = await client.users.login(
        loginDetails.usernameOrEmail,
        loginDetails.password,
      );

      currentUser.user = user.toJSON();
      reset(true);
      focusUsername();
      emit('close');
    },
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
}

onMounted(() => {
  reset(true);
  focusUsername();
});

defineExpose({ focusUsername, focusPassword, reset });
</script>
