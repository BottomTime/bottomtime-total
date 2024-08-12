import { AccountTier } from '@bottomtime/api';

import { Injectable } from '@nestjs/common';

import Stripe from 'stripe';
import { URL } from 'url';

import { Config } from '../config';
import { User } from '../users';
import { Products } from './products';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(Config.stripeSdkKey);
  }

  async getSession(sessionId: string): Promise<void> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    session.status;
    session.subscription;
  }

  async createSession(user: User, accountTier: AccountTier): Promise<string> {
    // TODO: Get Verified email first! Throw an error if not present + verified.

    let price: string;

    switch (accountTier) {
      case AccountTier.Pro:
        price = Products.proSubscription;
        break;

      case AccountTier.ShopOwner:
        price = Products.shopOwnerSubscription;
        break;

      default:
        throw new Error('lol?');
    }

    const returnUrl = new URL('/account/membership', Config.baseUrl);
    const session = await this.stripe.checkout.sessions.create({
      cancel_url: '',
      customer: user.id,
      customer_email: user.email || undefined,
      line_items: [
        {
          quantity: 1,
          price,
        },
      ],
      mode: 'subscription',
      ui_mode: 'embedded',
      return_url: `${returnUrl.toString()}?session_id={CHECKOUT_SESSION_ID}`,
    });

    if (!session.client_secret) {
      throw new Error('Client secret was not returned.');
    }

    return session.client_secret;
  }
}
