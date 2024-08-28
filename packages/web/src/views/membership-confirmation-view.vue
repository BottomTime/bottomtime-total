<template>
  <PageTitle title="Change Membership" />
  <!-- breadcrumbs? -->
  <div class="grid grid-cols-1 md:grid-cols-5">
    <div class="col-start-1 col-span-1 md:col-start-2 md:col-span-3">
      <FormBox class="text-center">
        <!-- Loading Spinner -->
        <LoadingSpinner
          v-if="state.view === CheckoutView.Loading"
          message="Please wait while we retrieve your membership information..."
        />

        <!-- Active Membership -->
        <ActiveMembership
          v-else-if="state.view === CheckoutView.Active"
          :membership="currentMembership"
          :membership-status="currentUser.membership"
        />

        <!-- Payment Required-->
        <MembershipPayment
          v-else-if="state.view === CheckoutView.PaymentRequired"
          :membership-status="currentUser.membership"
          :user="currentUser.user!"
          :failure="state.paymentFailed"
        />

        <PaymentTimeout v-else-if="state.view === CheckoutView.TimeOut" />

        <PaymentIntentError v-else />
      </FormBox>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AccountTier,
  BillingFrequency,
  ListMembershipsResponseDTO,
  MembershipDTO,
  MembershipStatus,
} from '@bottomtime/api';

import { Stripe } from '@stripe/stripe-js';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import FormBox from '../components/common/form-box.vue';
import LoadingSpinner from '../components/common/loading-spinner.vue';
import PageTitle from '../components/common/page-title.vue';
import ActiveMembership from '../components/users/membership/active-membership.vue';
import MembershipPayment from '../components/users/membership/membership-payment.vue';
import PaymentIntentError from '../components/users/membership/payment-intent-error.vue';
import PaymentTimeout from '../components/users/membership/payment-timeout.vue';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';
import { useStripe } from '../stripe-loader';

enum CheckoutView {
  Active = 'active',
  Error = 'error',
  Loading = 'loading',
  PaymentRequired = 'paymentRequired',
  TimeOut = 'timeout',
}

interface MembershipCheckoutViewState {
  backoffIndex: number;
  countdown: number;
  loadingMessage?: string;
  memberships?: ListMembershipsResponseDTO;
  paymentFailed: boolean;
  view: CheckoutView;
}

// 1, 3, 5, and 10 second backoff, and then 3 more retries 10 seconds apart.
// This yields a total of 8 attempts (including the original request) over a period of ~1 minute.
const IncrementalBackoff = [1000, 3000, 5000, 10000, 10000, 10000, 10000];

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();

const stripe = ref<Stripe | null>(null);
const state = reactive<MembershipCheckoutViewState>({
  backoffIndex: 0,
  countdown: 10,
  paymentFailed: false,
  view: CheckoutView.Loading,
});
const currentMembership = computed<MembershipDTO>(
  () =>
    state.memberships?.find(
      (m) => m.accountTier === currentUser.membership.accountTier,
    ) ?? {
      accountTier: AccountTier.Basic,
      frequency: BillingFrequency.Year,
      name: 'Free Account',
      currency: 'cad',
      price: 0,
    },
);

function getClientSecret(): string | null {
  const value = route.query.payment_intent_client_secret;
  return Array.isArray(value) ? value[0] : value;
}

async function getPaymentIntent(clientSecret: string): Promise<void> {
  await oops(
    async () => {
      const paymentIntent = await stripe.value!.retrievePaymentIntent(
        clientSecret,
      );

      if (paymentIntent.error) {
        // eslint-disable-next-line no-console
        console.warn(
          'Failed to retrieve payment intent from Stripe:',
          paymentIntent.error,
        );
        state.view = CheckoutView.Error;
        return;
      }

      switch (paymentIntent.paymentIntent?.status) {
        case 'succeeded':
          // Payment succeeded! W00T!
          state.view = CheckoutView.Active;
          break;

        case 'processing':
          // Payment still processing... Check again with incremental back-off?
          // This needs more work. Not sure how this works yet.
          state.loadingMessage =
            'Waiting for payment provider... Please do not close the browser tab or refresh.';
          if (state.backoffIndex < IncrementalBackoff.length) {
            setTimeout(
              () => oops(async () => await getPaymentIntent(clientSecret)),
              IncrementalBackoff[state.backoffIndex++],
            );
          } else {
            state.view = CheckoutView.TimeOut;
          }
          break;

        case 'requires_payment_method':
          // Payment failed. Ask user to re-enter payment details.
          state.paymentFailed = true;
          state.view = CheckoutView.PaymentRequired;
          break;

        default:
          // TODO: Unexpected result... do something to handle it.
          break;
      }
    },
    {
      default: (error) => {
        // eslint-disable-next-line no-console
        console.error('Unexpected error:', error);
        state.view = CheckoutView.Error;
      },
    },
  );
}

onMounted(async (): Promise<void> => {
  const clientSecret = getClientSecret();
  const currentStatus = currentUser.membership.status;

  stripe.value = await useStripe();

  await oops(async () => {
    state.memberships = await client.memberships.listMemberships();
  });

  if (clientSecret) {
    await getPaymentIntent(clientSecret);
    return;
  }

  if (
    currentStatus === MembershipStatus.Active ||
    currentStatus === MembershipStatus.Trialing
  ) {
    // Membershi is active. W00T!
    state.view = CheckoutView.Active;
  } else {
    // Need to update payment information before membership can be activated.
    state.view = CheckoutView.PaymentRequired;
  }
});
</script>
