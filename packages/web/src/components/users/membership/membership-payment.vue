<template>
  <div>
    <form
      class="space-y-3 text-justify"
      @submit.prevent="onPaymentDetailsEntered"
    >
      <TextHeading>Checkout</TextHeading>
      <div class="flex gap-3">
        <span class="my-2 text-secondary">
          <i :class="paymentIcon"></i>
        </span>

        <div class="space-y-3">
          <p class="pb-3">
            {{ paymentMessage }}
          </p>

          <div v-if="state.checkout" class="mx-3 space-y-1 font-mono text-xs">
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

          <p class="text-sm text-secondary text-center space-x-1.5">
            <span class="text-sm">
              <i class="fa-solid fa-circle-exclamation"></i>
            </span>
            <span class="italic">This amount will be billed annually.</span>
          </p>
        </div>
      </div>

      <div>
        <LoadingSpinner
          v-if="state.isLoading"
          message="Loading Stripe payment platform..."
        />
        <div id="payment-shim"></div>
      </div>

      <p v-if="state.error" class="text-danger text-lg">
        {{ state.error }}
      </p>

      <div class="text-sm flex flex-col text-center">
        <span class="text-4xl text-success">
          <i class="fa-brands fa-stripe"></i>
        </span>
        <p class="">
          Our secure payment system is provided by
          <NavLink class="space-x-0.5" to="https://stripe.com" new-tab>
            Stripe
          </NavLink>
          . At no point do we (Bottom Time) store or have access to your payment
          information. We take your privacy and security very seriously. For
          more information see our
          <NavLink to="/privacy" new-tab>privacy policy</NavLink>. Thank you!
        </p>
      </div>

      <div class="text-center">
        <FormButton
          type="primary"
          size="lg"
          submit
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

import { Stripe, StripeElements } from '@stripe/stripe-js';

import { URL } from 'url';
import { computed, onMounted, reactive, ref } from 'vue';

import { useClient } from '../../../api-client';
import { Config } from '../../../config';
import { useOops } from '../../../oops';
import { useStripe } from '../../../stripe-loader';
import FormButton from '../../common/form-button.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import NavLink from '../../common/nav-link.vue';
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
}

const client = useClient();
const oops = useOops();

const props = withDefaults(defineProps<MembershipPaymentProps>(), {
  failure: false,
});

const stripe = ref<Stripe | null>(null);
const elements = ref<StripeElements | null>(null);
const state = reactive<MembershipPaymentState>({
  isLoading: true,
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

  // Mount Stripe Payment element.
  await oops(async () => {
    stripe.value = await useStripe();
    const session = await client.memberships.createSession(props.user.username);

    elements.value = stripe.value.elements({
      clientSecret: session.clientSecret,
      appearance: { theme: darkMode === 'true' ? 'night' : 'stripe' },
    });
    const payment = elements.value.create('payment', {
      layout: 'accordion',
    });

    state.checkout = session;
    state.isLoading = false;

    payment.mount('#payment-shim');
  });
});

async function onPaymentDetailsEntered(): Promise<void> {
  if (!stripe.value || !elements.value) return;

  const returnUrl = new URL('/membership/confirmation', Config.baseUrl);
  const { error } = await stripe.value.confirmPayment({
    elements: elements.value,
    confirmParams: {
      return_url: returnUrl.toString(),
    },
  });

  if (error) state.error = error.message;
  else state.error = undefined;
}
</script>
