<template>
  <PageTitle title="Upgrade Membership" />

  <div class="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-3">
    <FormBox
      class="col-span-1 col-start-1 md:col-span-3 md:col-start-2 lg:col-span-1 lg:col-start-2 space-y-3"
    >
      <p class="text-center">
        Use the secure form below, powered by
        <NavLink class="font-bold" to="https://stripe.com" new-tab
          >Stripe</NavLink
        >, to upgrade your account.
      </p>

      <div v-if="state.isLoading" class="text-center">
        <LoadingSpinner message="Loading Stripe checkout form..." />
      </div>

      <div id="checkout"></div>
    </FormBox>
  </div>
</template>

<script lang="ts" setup>
import { AccountTier } from '@bottomtime/api';

import { loadStripe } from '@stripe/stripe-js';

import { onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { z } from 'zod';

import { useClient } from '../api-client';
import FormBox from '../components/common/form-box.vue';
import LoadingSpinner from '../components/common/loading-spinner.vue';
import NavLink from '../components/common/nav-link.vue';
import PageTitle from '../components/common/page-title.vue';
import { Config } from '../config';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';

interface CheckoutViewState {
  isLoading: boolean;
}

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();

const state = reactive<CheckoutViewState>({
  isLoading: true,
});

async function onComplete(): Promise<void> {}

onMounted(async () => {
  // Do nothing if the user is not logged in or this is running on the server.
  if (Config.isSSR || !currentUser.user) return;

  // Validate the accountTier query parameter.
  const parsedAccountTier = z
    .nativeEnum(AccountTier)
    .safeParse(parseInt(route.query.accountTier as string));
  if (!parsedAccountTier.success) {
    // TODO: Show error
    console.error(parsedAccountTier.error.errors);
    return;
  }

  // Validate that the user is actually upgrading their account.
  const accountTier = parsedAccountTier.data;
  if (accountTier <= currentUser.user.accountTier) {
    // TODO: Show error
    console.error('nope', currentUser.user.accountTier, accountTier);
    return;
  }

  await oops(async () => {
    const stripe = await loadStripe(Config.stripeSdkKey);
    const checkout = await stripe?.initEmbeddedCheckout({
      fetchClientSecret: async (): Promise<string> => {
        const { clientSecret } = await client.payments.createSession({
          accountTier,
        });
        return clientSecret;
      },
      onComplete,
    });

    state.isLoading = false;
    checkout?.mount('#checkout');
  });
});
</script>
