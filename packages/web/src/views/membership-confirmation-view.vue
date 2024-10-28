<template>
  <PageTitle title="Change Membership" />
  <BreadCrumbs :items="Breadcrumbs" />

  <RequireAuth>
    <div class="grid grid-cols-1 md:grid-cols-5">
      <div
        class="col-start-1 col-span-1 md:col-start-2 md:col-span-3 space-y-3"
      >
        <div class="flex items-center gap-6 text-justify italic mx-8 text-warn">
          <span class="text-4xl">
            <i class="fa-brands fa-stripe"></i>
          </span>
          <p class="">
            Our secure payment system is provided by
            <a href="https://stripe.com" target="_blank">Stripe</a>. At no point
            do we (Bottom Time) store or have access to your payment
            information. We take your privacy and security very seriously. For
            more information see our
            <a href="/privacy" target="_blank">privacy policy</a>. Thank you!
          </p>
        </div>

        <FormBox class="text-center">
          <!-- Loading Spinner -->
          <LoadingSpinner
            v-if="state.view === CheckoutView.Loading"
            data-testid="loading-message"
            :message="state.loadingMessage"
          />

          <!-- Active Membership -->
          <ActiveMembership
            v-else-if="state.view === CheckoutView.Active"
            :memberships="state.memberships ?? []"
            :membership-status="state.membershipStatus"
          />

          <!-- Payment Required-->
          <MembershipPayment
            v-else-if="state.view === CheckoutView.PaymentRequired"
            :membership-status="state.membershipStatus"
            :user="currentUser.user!"
            :failure="state.paymentFailed"
          />

          <PaymentTimeout v-else-if="state.view === CheckoutView.TimeOut" />

          <PaymentIntentError v-else />
        </FormBox>
      </div>
    </div>
  </RequireAuth>
</template>

<script setup lang="ts">
import {
  AccountTier,
  ListMembershipsResponseDTO,
  MembershipStatus,
  MembershipStatusDTO,
} from '@bottomtime/api';

import { onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import FormBox from '../components/common/form-box.vue';
import LoadingSpinner from '../components/common/loading-spinner.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth2.vue';
import ActiveMembership from '../components/users/membership/active-membership.vue';
import MembershipPayment from '../components/users/membership/membership-payment.vue';
import PaymentIntentError from '../components/users/membership/payment-intent-error.vue';
import PaymentTimeout from '../components/users/membership/payment-timeout.vue';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';
import { useStripeLoader } from '../stripe';

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
  loadingMessage: string;
  memberships?: ListMembershipsResponseDTO;
  membershipStatus: MembershipStatusDTO;
  paymentFailed: boolean;
  view: CheckoutView;
}

// 1, 3, 5, and 10 second backoff, and then 3 more retries 10 seconds apart.
// This yields a total of 8 attempts (including the original request) over a period of ~1 minute.
const IncrementalBackoff = [1000, 3000, 5000, 10000, 10000, 10000, 10000];
const Breadcrumbs: Breadcrumb[] = [
  { label: 'Account', to: '/account' },
  { label: 'Change Membership', active: true },
];

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();
const stripeLoader = useStripeLoader();

const state = reactive<MembershipCheckoutViewState>({
  backoffIndex: 0,
  countdown: 10,
  loadingMessage:
    'Please wait while we retrieve your membership information...',
  membershipStatus: {
    accountTier: AccountTier.Basic,
    entitlements: [],
    status: MembershipStatus.None,
  },
  paymentFailed: false,
  view: CheckoutView.Loading,
});

function getClientSecret(): string | null {
  const value = route.query.payment_intent_client_secret;
  return Array.isArray(value) ? value[0] : value;
}

async function getPaymentIntent(clientSecret: string): Promise<void> {
  const stripe = await stripeLoader.loadStripe();
  const paymentIntent = await stripe.retrievePaymentIntent(clientSecret);

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
}

onMounted(async (): Promise<void> => {
  const clientSecret = getClientSecret();

  await oops(async () => {
    if (!currentUser.user) return;

    [state.membershipStatus, state.memberships] = await Promise.all([
      client.memberships.getMembershipStatus(currentUser.user.username),
      client.memberships.listMemberships(),
    ]);

    if (clientSecret) {
      await getPaymentIntent(clientSecret);
      return;
    }

    if (
      state.membershipStatus.status === MembershipStatus.Active ||
      state.membershipStatus.status === MembershipStatus.Trialing
    ) {
      // Membership is active. W00T!
      state.view = CheckoutView.Active;
    } else {
      // Need to update payment information before membership can be activated.
      state.view = CheckoutView.PaymentRequired;
    }
  });
});
</script>
