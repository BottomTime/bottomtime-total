<template>
  <AccountTimestamps :user="user" />

  <form @submit.prevent="">
    <div class="flex flex-col gap-4">
      <TextHeading>Username and Email</TextHeading>

      <UsernameAndEmail
        :user="user"
        @change-email="(email) => $emit('change-email', email)"
        @change-username="(username) => $emit('change-username', username)"
      />

      <TextHeading>Password and Security</TextHeading>

      <ManagePassword
        :user="user"
        @change-password="$emit('change-password')"
      />

      <div class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline">
        <FormLabel
          class="lg:min-w-40 xl:min-w-48 lg:text-right"
          label="Login providers"
        />
        <div class="w-full flex flex-col gap-3">
          <div
            v-for="provider in OAuthProviders"
            :key="provider.name"
            class="flex flex-row gap-4 items-baseline"
          >
            <span class="hidden md:inline-block md:grow text-sm">
              <span class="mr-2">
                <i :class="provider.icon"></i>
              </span>
              <span> Enable logging in with {{ provider.name }} </span>
            </span>

            <div class="flex-initial min-w-40 xl:min-w-48">
              <a :href="provider.url">
                <FormButton stretch>
                  <span class="inline-block md:hidden mr-1">
                    <i :class="provider.icon"></i>
                  </span>
                  <span>Link {{ provider.name }} account</span>
                </FormButton>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { UserDTO } from '@bottomtime/api';

import FormButton from '../common/form-button.vue';
import FormLabel from '../common/form-label.vue';
import TextHeading from '../common/text-heading.vue';
import AccountTimestamps from './account-timestamps.vue';
import ManagePassword from './manage-password.vue';
import UsernameAndEmail from './username-and-email.vue';

// TYPE DEFS
type ManageAccountProps = {
  user: UserDTO;
};
type OAuthProvider = {
  name: string;
  url: string;
  icon: string;
};

// CONSTANTS
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

// STATE MANAGEMENT
defineProps<ManageAccountProps>();
defineEmits<{
  (e: 'change-username', username: string): void;
  (e: 'change-email', email: string): void;
  (e: 'change-password'): void;
}>();
</script>
