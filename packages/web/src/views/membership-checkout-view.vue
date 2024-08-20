<template>
  <div>Ok, done</div>
</template>

<script setup lang="ts">
import { Stripe } from '@stripe/stripe-js';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useStripe } from '../stripe-loader';

const route = useRoute();

const stripe = ref<Stripe | null>(null);

function getClientSecret(): string {
  const value = route.query.payment_intent_client_secret;
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

onMounted(async (): Promise<void> => {
  const clientSecret = getClientSecret();

  stripe.value = await useStripe();
  const paymentIntent = await stripe.value.retrievePaymentIntent(clientSecret);

  // TODO: Assess state and handle accordingly...
  switch (paymentIntent.paymentIntent?.status) {
    case 'succeeded':
      // Payment succeeded.
      break;

    case 'processing':
      // Payment still processing... Incremental backoff?
      break;

    case 'requires_payment_method':
      // Payment failed. Ask user to re-enter payment details.
      break;

    default:
      // Unexpected result... do something to handle it.
      break;
  }
});
</script>
