<template>
  <div class="space-y-4">
    <div
      v-if="state.noMembership"
      class="text-left"
      data-testid="no-membership-message"
    >
      <p>
        We could not find a pending membership associated with your account. If
        you would like to subscribe to one of our paid membership tiers, please
        visit your <a href="/account">account page</a> to initiate the process.
      </p>
    </div>

    <form
      v-else
      class="space-y-3 text-justify"
      @submit.prevent="onPaymentDetailsEntered"
    >
      <TextHeading>Checkout</TextHeading>
      <div>
        <p class="flex gap-4 items-center text-secondary">
          <span>
            <i :class="paymentIcon"></i>
          </span>
          <span data-testid="payment-message">
            {{ paymentMessage }}
          </span>
        </p>

        <div v-if="state.checkout" class="space-y-3 my-6">
          <TextHeading level="h2">Invoice</TextHeading>

          <div
            class="mx-3 space-y-2 font-mono text-xs"
            data-testid="payment-invoice"
          >
            <div
              v-for="lineItem of state.checkout.products"
              :key="lineItem.product"
              class="flex justify-between items-baseline"
            >
              <p>
                {{ lineItem.product }}
              </p>

              <p>
                {{ formatPrice(lineItem.price, state.checkout.currency) }}
              </p>
            </div>

            <div
              v-if="state.checkout.discounts"
              class="flex justify-between items-baseline"
            >
              <p>Discounts</p>
              <p class="font-mono text-sm">
                {{
                  formatPrice(state.checkout.discounts, state.checkout.currency)
                }}
              </p>
            </div>

            <div
              v-if="state.checkout.tax"
              class="flex justify-between items-baseline"
            >
              <p>Tax</p>
              <p class="font-mono text-sm">
                {{ formatPrice(state.checkout.tax, state.checkout.currency) }}
              </p>
            </div>

            <hr />

            <div class="flex justify-between items-baseline text-sm">
              <p class="font-bold">Total</p>
              <p class="font-bold">
                {{ formatPrice(state.checkout.total, state.checkout.currency) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center">
        <LoadingSpinner
          v-if="state.isLoading"
          message="Loading Stripe payment platform..."
        />
        <div id="payment-shim"></div>
      </div>

      <p
        v-if="state.error"
        class="text-danger text-lg"
        data-testid="payment-error"
      >
        {{ state.error }}
      </p>

      <div class="text-center">
        <FormButton
          type="primary"
          size="lg"
          submit
          test-id="btn-submit-payment"
          :is-loading="isSubmitting"
          @click="onPaymentDetailsEntered"
        >
          Subscribe
        </FormButton>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import {
  MembershipStatus,
  MembershipStatusDTO,
  PaymentSessionDTO,
  UserDTO,
} from '@bottomtime/api';

import { StripeElements } from '@stripe/stripe-js';

import { computed, onMounted, reactive, ref } from 'vue';

import { useClient } from '../../../api-client';
import { Config } from '../../../config';
import { useOops } from '../../../oops';
import { useStripeLoader } from '../../../stripe';
import FormButton from '../../common/form-button.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import TextHeading from '../../common/text-heading.vue';

interface MembershipPaymentProps {
  failure?: boolean;
  membershipStatus: MembershipStatusDTO;
  user: UserDTO;
}

interface MembershipPaymentState {
  checkout?: PaymentSessionDTO;
  error?: string;
  isLoading: boolean;
  noMembership: boolean;
}

const client = useClient();
const oops = useOops();
const stripeLoader = useStripeLoader();

const props = withDefaults(defineProps<MembershipPaymentProps>(), {
  failure: false,
});

const elements = ref<StripeElements | null>(null);
const isSubmitting = ref(false);
const state = reactive<MembershipPaymentState>({
  isLoading: true,
  noMembership: false,
});

const paymentMessage = computed(() => {
  switch (props.membershipStatus.status) {
    case MembershipStatus.Canceled:
      return 'Your membership has been cancelled. To re-instated your membership, please provide payment details.';
    case MembershipStatus.Expired:
      return 'Your trial period has expired. Please provide payment details to continue enjoying the benefits of your membership.';
    case MembershipStatus.Incomplete:
      return 'We are so happy to have you join the Bottom Time family at one of our special paid tiers! Your support really helps us keep this site going and we appreciate it! 😁 Please provide your payment details so that we can activate your new membership.';
    case MembershipStatus.None:
    case MembershipStatus.Paused:
    case MembershipStatus.PastDue:
      return 'We have not yet received payment for your membership. Please provide payment details to activate your membership.';
    case MembershipStatus.Unpaid:
      return 'We were unable to process payment for your membership using the payment method on file. Please provide updated payment info so we can resume your membership.';
    default:
      return 'Please provide payment details to activate your membership.';
  }
});

const paymentIcon = computed(() => {
  let icon: string;

  switch (props.membershipStatus.status) {
    default:
      icon = 'fas fa-info-circle';
      break;
  }

  return `${icon} text-2xl`;
});

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

onMounted(async () => {
  const darkMode = localStorage.getItem('darkMode');
  const stripe = await stripeLoader.loadStripe();

  // Mount Stripe Payment element.
  await oops(
    async () => {
      const session = await client.memberships.createSession(
        props.user.username,
      );

      elements.value = stripe.elements({
        clientSecret: session.clientSecret,
        appearance: { theme: darkMode === 'true' ? 'night' : 'stripe' },
      });
      const payment = elements.value.create('payment', {
        layout: 'accordion',
      });

      state.checkout = session;

      payment.mount('#payment-shim');
    },
    {
      [400]: () => {
        // Payment session could not be created becaues there is no record in Stripe of the user creating a
        // subscription. They will need to initiate this from the account page.
        state.noMembership = true;
      },
    },
  );

  state.isLoading = false;
});

async function onPaymentDetailsEntered(): Promise<void> {
  isSubmitting.value = true;

  const stripe = await stripeLoader.loadStripe();
  if (!elements.value) return;

  const returnUrl = new URL('/membership/confirmation', Config.baseUrl);
  const { error } = await stripe.confirmPayment({
    elements: elements.value,
    confirmParams: {
      return_url: returnUrl.toString(),
    },
  });

  if (error) state.error = error.message;
  else state.error = undefined;

  isSubmitting.value = false;
}
</script>
