import { Injectable } from '@nestjs/common';

import Stripe from 'stripe';
import { URL } from 'url';

import { Config } from '../config';
import { Products } from './products';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(Config.stripeSdkKey);
  }

  async createSession(): Promise<string> {
    const returnUrl = new URL('/account/membership', Config.baseUrl);
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          quantity: 1,
          price: Products.proSubscription,
        },
      ],
      mode: 'subscription',
      ui_mode: 'embedded',
      return_url: `${returnUrl.toString()}?session_id={CHECKOUT_SESSION_ID}`,
    });

    if (!session.client_secret) {
      throw new Error('Dafuq?');
    }

    return session.client_secret;
  }
}
