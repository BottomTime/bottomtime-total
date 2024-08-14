import { AccountTier } from '@bottomtime/api';

import { Inject, Injectable, Logger } from '@nestjs/common';

import Stripe from 'stripe';
import { URL } from 'url';

import { Config } from '../config';
import { User, UsersService } from '../users';
import { Products } from './products';

@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(@Inject(UsersService) private readonly users: UsersService) {
    this.stripe = new Stripe(Config.stripeSdkKey);
  }

  async getSession(sessionId: string): Promise<void> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    session.status;
    session.subscription;
  }

  async createSession(user: User, accountTier: AccountTier): Promise<string> {
    // TODO: Is the user already subscribed? If so, throw an error.
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
      customer_email: user.email || undefined,
      line_items: [
        {
          quantity: 1,
          price,
        },
      ],
      mode: 'subscription',
      ui_mode: 'embedded',
      return_url: `${returnUrl.toString()}?sessionId={CHECKOUT_SESSION_ID}`,
    });

    if (!session.client_secret) {
      throw new Error('Client secret was not returned.');
    }

    return session.client_secret;
  }

  async fulfillSessionOrder(sessionId: string): Promise<void> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    if (session.payment_status === 'unpaid') {
      // TODO: What do I do here?
      throw new Error('Payment is still unpaid.');
    }

    const user = await this.users.getUserById(session.customer as string);
    if (!user) {
      // TODO: What happens if user does not exist?
      throw new Error('User does not exist.');
    }

    session.subscription;

    // TODO: Perform fulfillment.
    // TODO: Provision new account tier.
    // TODO: Log fulfillment status / payment status. (Database?)
    // TODO: Send an email to the user to confirm thier account status change.
    // TODO: Record/save fulfillment status for this Checkout Session
  }

  parseWebhookEvent(payload: string, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      Config.stripeSdkKey,
    );
  }
}
