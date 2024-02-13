<template>
  <ChangePasswordDialog
    ref="changePasswordDialog"
    :visible="state.showChangePassword"
    :is-working="state.isSavingPassword"
    require-old-password
    @cancel="onCancelChangePassword"
    @confirm="onConfirmChangePassword"
  />
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
      <div class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline">
        <FormLabel
          class="lg:min-w-40 xl:min-w-48 lg:text-right"
          for="password"
          label="Password"
        />

        <span class="grow w-full">
          {{
            user.hasPassword
              ? 'A password has been set on this account'
              : 'No password has been set on this account'
          }}
        </span>

        <div class="min-w-36 lg:min-w-40 xl:min-w-48">
          <FormButton stretch @click="onChangePassword">
            {{ user.hasPassword ? 'Change' : 'Set' }} password...
          </FormButton>
        </div>
      </div>

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
            <span class="hidden md:inline-block md:grow">
              <span class="mr-2">
                <i :class="provider.icon"></i>
              </span>
              <span> Enable logging in with {{ provider.name }} </span>
            </span>

            <div class="flex-initial min-w-40 xl:min-w-48">
              <FormButton stretch @click="onLinkAccount(provider.name)">
                <span class="inline-block md:hidden mr-1">
                  <i :class="provider.icon"></i>
                </span>
                <span>Link {{ provider.name }} account</span>
              </FormButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { UserDTO } from '@bottomtime/api';

import { reactive, ref } from 'vue';

import { useClient } from '../../client';
import { ToastType } from '../../common';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import FormButton from '../common/form-button.vue';
import FormLabel from '../common/form-label.vue';
import TextHeading from '../common/text-heading.vue';
import ChangePasswordDialog from '../dialog/change-password-dialog.vue';
import AccountTimestamps from './account-timestamps.vue';
import UsernameAndEmail from './username-and-email.vue';

// TYPE DEFS
type ManageAccountProps = {
  user: UserDTO;
};
type ManageAccountState = {
  showChangePassword: boolean;
  isSavingPassword: boolean;
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

// DEPENDENCIES
const client = useClient();
const oops = useOops();
const toasts = useToasts();

// STATE MANAGEMENT
const props = defineProps<ManageAccountProps>();
const state = reactive<ManageAccountState>({
  showChangePassword: false,
  isSavingPassword: false,
});
const changePasswordDialog = ref<InstanceType<
  typeof ChangePasswordDialog
> | null>(null);

const emit = defineEmits<{
  (e: 'change-username', username: string): void;
  (e: 'change-email', email: string): void;
  (e: 'change-password'): void;
}>();

// EVENT HANDLERS
function onChangePassword() {
  state.showChangePassword = true;
}

async function onConfirmChangePassword(
  newPassword: string,
  oldPassword?: string,
): Promise<void> {
  state.isSavingPassword = true;

  await oops(async () => {
    const user = client.users.wrapDTO(props.user);
    const success = await user.changePassword(oldPassword ?? '', newPassword);

    if (success) {
      emit('change-password');
      toasts.toast({
        id: 'password-changed',
        message: 'Password was successfully changed.',
        type: ToastType.Success,
      });
      state.showChangePassword = false;
      changePasswordDialog.value?.reset();
    } else {
      toasts.toast({
        id: 'password-incorrect',
        message: 'Your old password was incorrect. Please try again.',
        type: ToastType.Error,
      });
      changePasswordDialog.value?.clearOldPassword();
    }
  });

  state.isSavingPassword = false;
}

function onCancelChangePassword() {
  state.showChangePassword = false;
  changePasswordDialog.value?.reset();
}

function onLinkAccount(provider: string) {
  console.log('Link account', provider);
}
</script>
