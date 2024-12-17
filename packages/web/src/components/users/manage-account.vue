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

        <p v-if="state.isLoadingProviders" class="italic space-x-3">
          <span>
            <i class="fas fa-spinner fa-spin"></i>
          </span>
          <span>Checking for connected providers...</span>
        </p>

        <div v-else class="w-full flex flex-col gap-3">
          <div
            v-for="provider in state.providers"
            :key="provider.name"
            class="flex flex-row gap-4 items-baseline"
          >
            <p
              v-if="provider.connected"
              class="hidden md:inline-block md:grow text-sm space-x-3 text-success font-bold"
            >
              <span>
                <i :class="`${provider.icon} fa-fw`"></i>
              </span>
              <span class="text-bold"> {{ provider.name }} is connected! </span>
            </p>

            <p v-else class="hidden md:inline-block md:grow text-sm space-x-3">
              <span>
                <i :class="`${provider.icon} fa-fw`"></i>
              </span>
              <span> Enable logging in with {{ provider.name }} </span>
            </p>

            <div class="flex-initial min-w-40 xl:min-w-48">
              <FormButton
                v-if="provider.connected"
                :test-id="`unlink-${provider.key}`"
                type="danger"
                stretch
                @click="() => onUnlinkAccount(provider.key)"
              >
                Unlink {{ provider.name }} account
              </FormButton>

              <a v-else :href="provider.url">
                <FormButton :test-id="`link-${provider.key}`" stretch>
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

      <TextHeading>Membership</TextHeading>

      <ManageMembership :user="user" />
    </div>
  </form>
</template>

<script lang="ts" setup>
import { UserDTO } from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../api-client';
import { ToastType } from '../../common';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import FormButton from '../common/form-button.vue';
import FormLabel from '../common/form-label.vue';
import TextHeading from '../common/text-heading.vue';
import AccountTimestamps from './account-timestamps.vue';
import ManagePassword from './manage-password.vue';
import ManageMembership from './membership/manage-membership.vue';
import UsernameAndEmail from './username-and-email.vue';

// TYPE DEFS
type ManageAccountProps = {
  user: UserDTO;
};

type OAuthProvider = {
  key: string;
  name: string;
  url: string;
  icon: string;
  connected: boolean;
};
type ManageAccountState = {
  isLoadingProviders: boolean;
  providers: OAuthProvider[];
};

const client = useClient();
const oops = useOops();
const toasts = useToasts();

// CONSTANTS
const OAuthProviders: Omit<OAuthProvider, 'connected'>[] = [
  {
    key: 'google',
    name: 'Google',
    url: '/api/auth/google',
    icon: 'fab fa-google',
  },
  {
    key: 'discord',
    name: 'Discord',
    url: '/api/auth/discord',
    icon: 'fab fa-discord',
  },
  {
    key: 'github',
    name: 'Github',
    url: '/api/auth/github',
    icon: 'fab fa-github',
  },
];

// STATE MANAGEMENT
const props = defineProps<ManageAccountProps>();
defineEmits<{
  (e: 'change-username', username: string): void;
  (e: 'change-email', email: string): void;
  (e: 'change-password'): void;
}>();

const state = reactive<ManageAccountState>({
  isLoadingProviders: true,
  providers: [],
});

onMounted(async () => {
  await oops(async () => {
    const connectedProviders = await client.auth.getOAuthProviders(
      props.user.username,
    );

    state.providers = OAuthProviders.map((provider) => ({
      ...provider,
      connected: connectedProviders.has(provider.key),
    }));
  });
  state.isLoadingProviders = false;
});

// METHODS
const onUnlinkAccount = async (providerKey: string) => {
  await oops(async () => {
    await client.auth.unlinkOAuthProvider(props.user.username, providerKey);
    toasts.toast({
      id: `account-unlinked-${providerKey}`,
      message: 'Account unlinked successfully!',
      type: ToastType.Success,
    });
    const provider = state.providers.find((p) => p.key === providerKey);
    if (provider) provider.connected = false;
  });
};
</script>
