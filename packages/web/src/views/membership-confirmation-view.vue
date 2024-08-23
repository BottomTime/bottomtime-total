<template>
  <PageTitle title="Change Membership" />
  <!-- breadcrumbs? -->
  <div class="grid grid-cols-1 md:grid-cols-5">
    <div class="col-start-1 col-span-1 md:col-start-2 md:col-span-3">
      <FormBox class="text-center">
        <LoadingSpinner
          v-if="state.view === CheckoutView.Loading"
          :message="state.loadingMessage || 'Please wait...'"
        />

        <div
          v-else-if="state.view === CheckoutView.Success"
          class="text-success space-y-3"
        >
          <p>
            <i class="fas fa-check-circle text-5xl text-green-500"></i>
          </p>

          <TextHeading>Membership Update Succeeded!</TextHeading>

          <p>
            Your membership has been successfully updated and will take effect
            in a few seconds.
          </p>

          <p>
            <FormButton type="primary" @click="doRedirect">
              Redirecting back to account page in
              {{ state.countdown }} seconds...
            </FormButton>
          </p>
        </div>
      </FormBox>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Stripe } from '@stripe/stripe-js';

import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import FormBox from '../components/common/form-box.vue';
import FormButton from '../components/common/form-button.vue';
import LoadingSpinner from '../components/common/loading-spinner.vue';
import PageTitle from '../components/common/page-title.vue';
import TextHeading from '../components/common/text-heading.vue';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useStripe } from '../stripe-loader';

enum CheckoutView {
  Error = 'error',
  Loading = 'loading',
  PaymentFailed = 'paymentFailed',
  Success = 'success',
  TimedOut = 'timedOut',
}

interface MembershipCheckoutViewState {
  countdown: number;
  loadingMessage?: string;
  view: CheckoutView;
}

const location = useLocation();
const oops = useOops();
const route = useRoute();

const stripe = ref<Stripe | null>(null);
const state = reactive<MembershipCheckoutViewState>({
  countdown: 10,
  view: CheckoutView.Loading,
});

function getClientSecret(): string {
  const value = route.query.payment_intent_client_secret;
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

function startRedirectTimer() {
  const countdown = () => {
    state.countdown -= 1;
    if (state.countdown > 0) {
      setTimeout(countdown, 1000);
    } else {
      doRedirect();
    }
  };
  setTimeout(countdown, 1000);
}

function doRedirect() {
  location.assign('/account');
}

onMounted(async (): Promise<void> => {
  const clientSecret = getClientSecret();

  await oops(async () => {
    stripe.value = await useStripe();
    const paymentIntent = await stripe.value.retrievePaymentIntent(
      clientSecret,
    );

    // TODO: Assess state and handle accordingly...
    switch (paymentIntent.paymentIntent?.status) {
      case 'succeeded':
        state.view = CheckoutView.Success;
        startRedirectTimer();
        break;

      case 'processing':
        state.view = CheckoutView.Loading;
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
});
</script>
