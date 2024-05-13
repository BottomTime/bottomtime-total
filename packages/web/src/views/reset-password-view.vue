<template>
  <PageTitle title="Reset Password" />

  <RequireAnon>
    <RequestPasswordReset
      :email-sent="emailSent"
      :is-loading="isLoading"
      @request-email="onRequestEmail"
    />
  </RequireAnon>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import PageTitle from '../components/common/page-title.vue';
import RequireAnon from '../components/common/require-anon.vue';
import RequestPasswordReset from '../components/users/request-password-reset.vue';
import { useOops } from '../oops';

const client = useClient();
const oops = useOops();
const route = useRoute();

const isLoading = ref(false);
const emailSent = ref(false);

const hasToken = computed(
  () =>
    typeof route.query.username === 'string' && route.query.token === 'string',
);

async function onRequestEmail(username: string): Promise<void> {
  isLoading.value = true;

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

  emailSent.value = true;
  isLoading.value = false;
}
</script>
