<template>
  <PageTitle title="Reset Password" />

  <RequireAnon>
    <ResetPassword
      v-if="state.hasToken"
      :is-loading="state.isLoading"
      :username="state.username"
      :token="state.token"
      :reset-state="state.resetState"
      @reset-password="onResetPassword"
    />

    <RequestPasswordReset
      v-else
      :email-sent="state.emailSent"
      :is-loading="state.isLoading"
      @request-email="onRequestEmail"
    />
  </RequireAnon>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import PageTitle from '../components/common/page-title.vue';
import RequireAnon from '../components/common/require-anon.vue';
import RequestPasswordReset from '../components/users/request-password-reset.vue';
import ResetPassword from '../components/users/reset-password.vue';
import { useOops } from '../oops';

interface ResetPasswordViewState {
  emailSent: boolean;
  hasToken: boolean;
  isLoading: boolean;
  resetState: 'waiting' | 'success' | 'failed';
  token: string;
  username: string;
}

const client = useClient();
const oops = useOops();
const route = useRoute();

const state = reactive<ResetPasswordViewState>({
  emailSent: false,
  hasToken:
    typeof route.query.user === 'string' &&
    typeof route.query.token === 'string',
  isLoading: false,
  resetState: 'waiting',
  token: typeof route.query.token === 'string' ? route.query.token : '',
  username: typeof route.query.user === 'string' ? route.query.user : '',
});

async function onRequestEmail(username: string): Promise<void> {
  state.isLoading = true;

  await oops(
    async () => {
      await client.users.requestPasswordResetToken(username);
    },
    {
      [404]: () => {
        // Unable to send the email because the user account does not exist. We'll pretend it did for security reasons.
      },
    },
  );

  state.emailSent = true;
  state.isLoading = false;
}

async function onResetPassword(newPassword: string): Promise<void> {
  state.isLoading = true;

  await oops(
    async () => {
      // const succeeded = await client.users.resetPasswordWithToken(
      //   state.username,
      //   state.token,
      //   newPassword,
      // );
      const succeeded = false;

      // TODO: WTF? Handle succeeded... token is invalid or expired.
      state.resetState = succeeded ? 'success' : 'failed';
    },
    {
      [404]: () => {
        // User account does not exist... inidicate failure.
        state.resetState = 'failed';
      },
    },
  );

  state.isLoading = false;
}
</script>
