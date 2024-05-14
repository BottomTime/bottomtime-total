<template>
  <PageTitle title="Reset Password" />

  <RequireAnon>
    <div
      v-if="state.isLoadingProfile"
      class="text-center text-lg italic space-x-3 my-8"
    >
      <span>
        <i class="fas fa-spinner fa-spin fa-lg"></i>
      </span>
      <span>Verifying token...</span>
    </div>

    <ResetPassword
      v-else-if="params.hasToken"
      :is-loading="state.isResettingPassword"
      :username="params.username"
      :token="params.token"
      :reset-state="state.resetState"
      @reset-password="onResetPassword"
    />

    <RequestPasswordReset
      v-else
      :email-sent="state.emailSent"
      :is-loading="state.isResettingPassword"
      @request-email="onRequestEmail"
    />
  </RequireAnon>
</template>

<script setup lang="ts">
import { PasswordResetTokenStatus } from '@bottomtime/api';

import { computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import PageTitle from '../components/common/page-title.vue';
import RequireAnon from '../components/common/require-anon.vue';
import RequestPasswordReset from '../components/users/request-password-reset.vue';
import ResetPassword from '../components/users/reset-password.vue';
import { useOops } from '../oops';

interface ResetPasswordParams {
  hasToken: boolean;
  token: string;
  username: string;
}

interface ResetPasswordViewState {
  emailSent: boolean;
  isLoadingProfile: boolean;
  isResettingPassword: boolean;
  resetState?: PasswordResetTokenStatus;
}

const client = useClient();
const oops = useOops();
const route = useRoute();

const params = computed<ResetPasswordParams>(() => ({
  hasToken:
    typeof route.query.user === 'string' &&
    typeof route.query.token === 'string',
  token: typeof route.query.token === 'string' ? route.query.token : '',
  username: typeof route.query.user === 'string' ? route.query.user : '',
}));
const state = reactive<ResetPasswordViewState>({
  emailSent: false,
  isLoadingProfile: params.value.hasToken,
  isResettingPassword: false,
});

async function onRequestEmail(username: string): Promise<void> {
  state.isResettingPassword = true;

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
  state.isResettingPassword = false;
}

async function onResetPassword(newPassword: string): Promise<void> {
  state.isResettingPassword = true;

  await oops(
    async () => {
      const succeeded = await client.users.resetPasswordWithToken(
        params.value.username,
        params.value.token,
        newPassword,
      );

      state.resetState = succeeded
        ? PasswordResetTokenStatus.Valid
        : PasswordResetTokenStatus.Invalid;
    },
    {
      [404]: () => {
        // User account does not exist... inidicate failure.
        state.resetState = PasswordResetTokenStatus.Invalid;
      },
    },
  );

  state.isResettingPassword = false;
}

onMounted(async () => {
  await oops(
    async () => {
      if (!params.value.hasToken) return;

      const tokenStatus = await client.users.validatePasswordResetToken(
        params.value.username,
        params.value.token,
      );

      state.resetState =
        tokenStatus === PasswordResetTokenStatus.Valid
          ? undefined
          : tokenStatus;
    },
    {
      [404]: () => {
        // Profile missing... indicate failure.
        state.resetState = PasswordResetTokenStatus.Invalid;
      },
    },
  );

  state.isLoadingProfile = false;
});
</script>
