import { Stripe, loadStripe } from '@stripe/stripe-js';

import { Config } from './config';

let stripe: Stripe;

export async function useStripe(): Promise<Stripe> {
  if (!stripe) {
    const instance = await loadStripe(Config.stripeSdkKey);
    if (!instance) {
      throw new Error('Failed to load Stripe SDK');
    }

    stripe = instance;
  }

  return stripe;
}
