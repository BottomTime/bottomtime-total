<template>
  <AccountTimestamps :user="user" />

  <form @submit.prevent="">
    <div class="flex flex-col gap-4">
      <TextHeading>Username and Email</TextHeading>
      <!-- Username -->
      <fieldset
        class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline"
        :disabled="state.isSavingUsername"
      >
        <FormLabel
          class="lg:min-w-40 xl:min-w-48 lg:text-right"
          for="username"
          label="Username"
        />

        <div class="grow w-full">
          <div v-if="state.isEditingUsername" class="flex flex-col gap-2">
            <FormTextBox
              ref="usernameInput"
              v-model.trim="username"
              control-id="username"
              test-id="username"
              select-on-focus
              :invalid="vUsername$?.username?.$error"
              :maxlength="50"
              autofocus
              stretch
              @enter="onConfirmChangeUsername"
              @esc="onCancelChangeUsername"
            />
            <span
              v-if="vUsername$?.username?.$error"
              class="text-danger text-sm"
            >
              {{ vUsername$?.username?.$errors[0]?.$message }}
            </span>
          </div>
          <span v-else>
            {{ user.username }}
          </span>
        </div>

        <div class="min-w-36 lg:min-w-40 xl:min-w-48">
          <div
            v-if="state.isEditingUsername"
            class="flex flex-row gap-2 justify-stretch"
          >
            <FormButton
              type="primary"
              test-id="save-username"
              :is-loading="state.isSavingUsername"
              stretch
              @click="onConfirmChangeUsername"
            >
              Save
            </FormButton>
            <FormButton stretch @click="onCancelChangeUsername">
              Cancel
            </FormButton>
          </div>

          <FormButton v-else stretch @click="onChangeUsername">
            Change username...
          </FormButton>
        </div>
      </fieldset>

      <!-- Email -->
      <fieldset
        class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline"
        :disabled="state.isSavingEmail"
      >
        <FormLabel
          class="lg:min-w-40 xl:min-w-48 lg:text-right"
          for="email"
          label="Email address"
        />

        <div class="grow w-full">
          <div v-if="state.isEditingEmail" class="flex flex-col gap-2">
            <FormTextBox
              ref="emailInput"
              v-model.trim="email"
              control-id="email"
              test-id="email"
              select-on-focus
              :invalid="vEmail$?.email?.$error"
              :maxlength="50"
              autofocus
              stretch
              @enter="onConfirmChangeEmail"
              @esc="onCancelChangeEmail"
            />
            <span v-if="vEmail$?.email?.$error" class="text-danger text-sm">
              {{ vEmail$?.email?.$errors[0]?.$message }}
            </span>
          </div>

          <span v-else>
            {{ user.email }}
          </span>
        </div>

        <div class="min-w-36 lg:min-w-40 xl:min-w-48">
          <div
            v-if="state.isEditingEmail"
            class="flex flex-row gap-2 justify-stretch"
          >
            <FormButton
              type="primary"
              test-id="save-email"
              :is-loading="state.isSavingEmail"
              stretch
              @click="onConfirmChangeEmail"
            >
              Save
            </FormButton>
            <FormButton stretch @click="onCancelChangeEmail">
              Cancel
            </FormButton>
          </div>

          <FormButton v-else stretch @click="onChangeEmail">
            Change email...
          </FormButton>
        </div>
      </fieldset>

      <div class="flex flex-row gap-4 items-baseline">
        <span class="w-48"></span>
        <div class="grow">
          <span v-if="user.emailVerified" class="text-success">
            <span class="mr-2">
              <i class="fas fa-check"></i>
            </span>
            <span class="italic">Email address is verified</span>
          </span>

          <span v-else class="text-warn">
            <span class="mr-2">
              <i class="fas fa-exclamation-triangle"></i>
            </span>
            <span class="italic">Email address has not been verified</span>
          </span>
        </div>
        <div v-if="!user.emailVerified" class="w-48">
          <FormButton stretch @click="onSendVerificationEmail">
            Send verification email
          </FormButton>
        </div>
      </div>

      <TextHeading>Password and Security</TextHeading>
      <div class="flex flex-row gap-4 items-baseline">
        <FormLabel class="w-48 text-right" for="password" label="Password" />
        <span class="grow">
          {{
            user.hasPassword
              ? 'A password has been set on this account'
              : 'No password has been set on this account'
          }}
        </span>
        <div class="w-48">
          <FormButton stretch @click="onChangePassword">
            {{ user.hasPassword ? 'Change' : 'Set' }} password...
          </FormButton>
        </div>
      </div>

      <div class="flex flex-row gap-4 items-baseline">
        <FormLabel class="w-48 text-right" label="Login providers" />
        <div class="grow flex flex-col gap-3">
          <div
            v-for="provider in OAuthProviders"
            :key="provider.name"
            class="flex flex-row gap-4 items-baseline"
          >
            <span class="grow">
              <span class="mr-2">
                <i :class="provider.icon"></i>
              </span>
              <span> Enable logging in with {{ provider.name }} </span>
            </span>

            <FormButton class="w-48" @click="onLinkAccount(provider.name)">
              <span class="mr-2">
                <i :class="provider.icon"></i>
              </span>
              <span>Link your {{ provider.name }} account</span>
            </FormButton>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { UserDTO, UsernameRegex } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, required, email as validEmail } from '@vuelidate/validators';

import { nextTick, reactive, ref } from 'vue';

import { useClient } from '../../client';
import { ToastType } from '../../common';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import FormButton from '../common/form-button.vue';
import FormLabel from '../common/form-label.vue';
import FormTextBox from '../common/form-text-box.vue';
import TextHeading from '../common/text-heading.vue';
import AccountTimestamps from './account-timestamps.vue';

type ManageAccountProps = {
  user: UserDTO;
};
type ManageAccountState = {
  isEditingUsername: boolean;
  isSavingUsername: boolean;
  isEditingEmail: boolean;
  isSavingEmail: boolean;
  showChangePassword: boolean;
  isSavingPassword: boolean;
  isSendingVerificationEmail: boolean;
  verificationEmailSent: boolean;
};
type OAuthProvider = {
  name: string;
  url: string;
  icon: string;
};

const OAuthProviders: OAuthProvider[] = [
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

const client = useClient();
const oops = useOops();
const toasts = useToasts();

const props = defineProps<ManageAccountProps>();
const state = reactive<ManageAccountState>({
  isEditingUsername: false,
  isSavingUsername: false,
  isEditingEmail: false,
  isSavingEmail: false,
  showChangePassword: false,
  isSavingPassword: false,
  isSendingVerificationEmail: false,
  verificationEmailSent: false,
});
const username = ref('');
const usernameInput = ref<InstanceType<typeof FormTextBox> | null>(null);
const email = ref('');
const emailInput = ref<InstanceType<typeof FormTextBox> | null>(null);

const vUsername$ = useVuelidate(
  {
    username: {
      required: helpers.withMessage('New username is required', required),
      regex: helpers.withMessage(
        'Username must be at least 3 characters and contain only letters, numbers, dashes, dots, and underscores',
        helpers.regex(UsernameRegex),
      ),
    },
  },
  { username },
);

const vEmail$ = useVuelidate(
  {
    email: {
      required: helpers.withMessage('New email address is required', required),
      email: helpers.withMessage('Must be a valid email address', validEmail),
    },
  },
  { email },
);

const emit = defineEmits<{
  (e: 'change-username', username: string): void;
  (e: 'change-email', email: string): void;
}>();

// Managing Username
function onChangeUsername() {
  username.value = props.user.username;
  vUsername$.value.$reset();
  state.isEditingUsername = true;
}

async function onConfirmChangeUsername() {
  const isValid = await vUsername$.value.$validate();
  if (!isValid) {
    usernameInput.value?.focus();
    return;
  }

  state.isSavingUsername = true;
  await oops(
    async () => {
      const user = client.users.wrapDTO(props.user);
      await user.changeUsername(username.value);
      emit('change-username', username.value);
      toasts.toast({
        id: 'username-changed',
        message: 'Username was successfully changed.',
        type: ToastType.Success,
      });
      state.isEditingUsername = false;
    },
    {
      409: async () => {
        toasts.toast({
          id: 'username-conflict',
          message:
            'The username you entered is already in use. Please try another.',
          type: ToastType.Error,
        });

        state.isSavingUsername = false;
        await nextTick();
        usernameInput.value?.focus();
      },
    },
  );
  state.isSavingUsername = false;
}

function onCancelChangeUsername() {
  state.isEditingUsername = false;
}

// Managing Email address
function onChangeEmail() {
  email.value = props.user.email ?? '';
  vEmail$.value.$reset();
  state.isEditingEmail = true;
}

async function onConfirmChangeEmail(): Promise<void> {
  const isValid = await vEmail$.value.$validate();
  if (!isValid) {
    emailInput.value?.focus();
    return;
  }

  state.isSavingEmail = true;

  await oops(
    async () => {
      const user = client.users.wrapDTO(props.user);
      await user.changeEmail(email.value);
      emit('change-email', email.value);
      toasts.toast({
        id: 'email-changed',
        message: 'Email address was successfully changed.',
        type: ToastType.Success,
      });
      state.isEditingEmail = false;
    },
    {
      409: async () => {
        toasts.toast({
          id: 'email-conflict',
          message:
            'The email address you entered is already in use. Please try another.',
          type: ToastType.Error,
        });

        state.isSavingEmail = false;
        await nextTick();
        emailInput.value?.focus();
      },
    },
  );

  state.isSavingEmail = false;
}

function onCancelChangeEmail() {
  state.isEditingEmail = false;
}

function onSendVerificationEmail() {
  console.log('Send verification email');
}

function onChangePassword() {
  console.log('Change password');
}

function onLinkAccount(provider: string) {
  console.log('Link account', provider);
}
</script>
