<template>
  <div>
    <LoadingSpinner
      v-if="state.isLoading"
      message="Loading Stripe payment platform..."
    />
    <form
      class="space-y-3 text-center"
      @submit.prevent="onPaymentDetailsEntered"
    >
      <div id="payment-shim"></div>

      <p v-if="state.error" class="text-danger text-lg">
        {{ state.error }}
      </p>

      <FormButton type="primary" submit @click="onPaymentDetailsEntered">
        Subscribe
      </FormButton>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { Stripe, StripeElements } from '@stripe/stripe-js';

import { URL } from 'url';
import { onMounted, reactive, ref } from 'vue';

import { useClient } from '../../../api-client';
import { Config } from '../../../config';
import { useOops } from '../../../oops';
import { useStripe } from '../../../stripe-loader';
import FormButton from '../../common/form-button.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';

interface MembershipPaymentState {
  error?: string;
  isLoading: boolean;
}

const client = useClient();
const oops = useOops();

const stripe = ref<Stripe | null>(null);
const elements = ref<StripeElements | null>(null);
const state = reactive<MembershipPaymentState>({
  isLoading: true,
});

onMounted(async () => {
  // Mount Stripe Payment element.
  await oops(async () => {
    stripe.value = await useStripe();
    const { clientSecret } = await client.payments.createSession();

    elements.value = stripe.value.elements({
      clientSecret,
    });
    const payment = elements.value.create('payment');
    state.isLoading = false;

    payment.mount('#payment-shim');
  });
});

async function onPaymentDetailsEntered(): Promise<void> {
  if (!stripe.value || !elements.value) return;

  const returnUrl = new URL('/account', Config.baseUrl).toString();
  const { error } = await stripe.value.confirmPayment({
    elements: elements.value,
    confirmParams: {
      return_url: returnUrl.toString(),
    },
  });

  if (error) state.error = error.message;
  else state.error = undefined;

  // TODO: Redirec to a confirmation page.
}
</script>
