<template>
  <AccountTimestamps :user="user" />

  <form @submit.prevent="">
    <div class="flex flex-col gap-4">
      <TextHeading>Username and Email</TextHeading>
      <div class="flex flex-row gap-4 items-baseline">
        <FormLabel class="w-48 text-right" for="username" label="Username" />
        <span class="grow">
          {{ user.username }}
        </span>
        <div class="w-48">
          <FormButton stretch @click="onChangeUsername">
            Change username...
          </FormButton>
        </div>
      </div>

      <div class="flex flex-row gap-4 items-baseline">
        <FormLabel class="w-48 text-right" for="email" label="Email address" />
        <span class="grow">
          {{ user.email }}
        </span>
        <div class="w-48">
          <FormButton stretch @click="onChangeEmail">
            Change email...
          </FormButton>
        </div>
      </div>

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
              <i class="fas fa-times"></i>
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

            <FormButton class="w-48">
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
import { UserDTO } from '@bottomtime/api';

import { reactive } from 'vue';

import FormButton from '../common/form-button.vue';
import FormLabel from '../common/form-label.vue';
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

defineProps<ManageAccountProps>();
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

function onChangeUsername() {
  console.log('Change username');
}

function onChangeEmail() {
  console.log('Change email');
}

function onSendVerificationEmail() {
  console.log('Send verification email');
}

function onLinkAccount(provider: string) {
  console.log('Link account', provider);
}
</script>
