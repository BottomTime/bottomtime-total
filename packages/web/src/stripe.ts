import { Stripe, loadStripe } from '@stripe/stripe-js';

import { inject } from 'vue';

import { Config } from './config';

export const StripeLoaderKey = Symbol('stripe');

export interface IStripeLoader {
  loadStripe(): Promise<Stripe>;
}

export class StripeLoader implements IStripeLoader {
  private stripe: Stripe | null = null;

  async loadStripe(): Promise<Stripe> {
    if (this.stripe) return this.stripe;

    this.stripe = await loadStripe(Config.stripeSdkKey);
    if (!this.stripe) {
      throw new Error('Failed to initialize Stripe SDK client');
    }

    return this.stripe;
  }
}

export function useStripeLoader(): IStripeLoader {
  const stripe = inject<IStripeLoader>(StripeLoaderKey);
  if (!stripe) {
    throw new Error(
      'Unable to find IStripeLoader instance. Did you remember to call app.provide()?',
    );
  }

  return stripe;
}
