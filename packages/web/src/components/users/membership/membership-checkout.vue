<template>
  <div id="checkout"></div>

  <FormBox v-if="!checkoutLoaded" class="text-center">
    <LoadingSpinner message="Loading Stripe checkout form..." />
  </FormBox>
</template>

<script lang="ts" setup>
import { AccountTier, UserDTO } from '@bottomtime/api';

import { loadStripe } from '@stripe/stripe-js';

import { onMounted, ref } from 'vue';

import { useClient } from '../../../api-client';
import { Config } from '../../../config';
import { useOops } from '../../../oops';
import FormBox from '../../common/form-box.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';

interface MembershipCheckoutProps {
  accountTier: AccountTier;
  user: UserDTO;
}

const client = useClient();
const oops = useOops();

const checkoutLoaded = ref(false);

const props = defineProps<MembershipCheckoutProps>();

onMounted(async () => {
  await oops(async () => {
    const stripe = await loadStripe(Config.stripeSdkKey);
    const { clientSecret } = await client.payments.createSession({
      accountTier: props.accountTier,
    });
    const checkout = await stripe?.initEmbeddedCheckout({
      clientSecret,
    });
    checkoutLoaded.value = true;
    checkout?.mount('#checkout');
  });
});
</script>
