<template>
  <PageTitle title="Update Membership" />

  <div class="grid grid-cols-1 lg:grid-cols-5">
    <div class="col-span-1 col-start-1 lg:col-span-3 lg:col-start-2 space-y-6">
      <p>
        In order to update your membership, please provide your payment details
        below using our secure checkout powered by
        <span class="font-bold">Stripe.</span>
      </p>
      <FormBox>
        <div id="checkout"></div>
      </FormBox>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { loadStripe } from '@stripe/stripe-js';

import { onMounted } from 'vue';

import { useClient } from '../api-client';
import FormBox from '../components/common/form-box.vue';
import PageTitle from '../components/common/page-title.vue';
import { Config } from '../config';
import { useOops } from '../oops';

const client = useClient();
const oops = useOops();

onMounted(async () => {
  if (Config.isSSR) return;

  await oops(async () => {
    const stripe = await loadStripe(Config.stripeSdkKey);
    const { clientSecret } = await client.payments.createSession();
    const checkout = await stripe?.initEmbeddedCheckout({
      clientSecret,
    });
    checkout?.mount('#checkout');
  });
});
</script>
