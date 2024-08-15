import {
  AccountTier,
  MembershipStatus,
  MembershipStatusDTO,
} from '@bottomtime/api';

import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';

import Stripe from 'stripe';

import { Config } from '../config';
import { User, UsersService } from '../users';
import { Prices, Products } from './products';

const SubscriptionStatusMap: Record<
  Stripe.Subscription.Status,
  MembershipStatus
> = {
  active: MembershipStatus.Active,
  canceled: MembershipStatus.Canceled,
  incomplete: MembershipStatus.Incomplete,
  incomplete_expired: MembershipStatus.Expired,
  past_due: MembershipStatus.PastDue,
  paused: MembershipStatus.Paused,
  trialing: MembershipStatus.Trialing,
  unpaid: MembershipStatus.Unpaid,
} as const;

const DefaultMembershipStatus: MembershipStatusDTO = {
  accountTier: AccountTier.Basic,
  status: MembershipStatus.None,
};

@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(@Inject(UsersService) private readonly users: UsersService) {
    this.stripe = new Stripe(Config.stripeSdkKey);
  }

  async getMembershipStatus(user: User): Promise<MembershipStatusDTO> {
    if (!user.stripeCustomerId) {
      // No Stripe customer. Default to free tier.
      return DefaultMembershipStatus;
    }

    const customer = await this.stripe.customers.retrieve(
      user.stripeCustomerId,
      {
        expand: ['subscriptions'],
      },
    );

    if (customer.deleted) {
      // Customer was deleted. Default to free tier.
      return DefaultMembershipStatus;
    }

    if (!customer.subscriptions?.data.length) {
      // No subscriptions. Default to free tier.
      return DefaultMembershipStatus;
    }

    const subscription = customer.subscriptions.data[0];

    const status = SubscriptionStatusMap[subscription.status];

    const productId = subscription.items.data[0].price.product;
    const accountTier: AccountTier =
      Products[productId as keyof typeof Products] ?? AccountTier.Basic;

    return {
      accountTier,
      cancellationDate: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : undefined,
      nextBillingDate: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : undefined,
      status,
      trialEndDate: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : undefined,
    };
  }

  async createSession(user: User, accountTier: AccountTier): Promise<string> {
    if (!user.email || !user.emailVerified) {
      throw new ForbiddenException(
        'User must have a verified email address before creating a subscription',
      );
    }
    // TODO: Is the user already subscribed? If so, throw an error.

    let price: string;

    switch (accountTier) {
      case AccountTier.Pro:
        price = Prices.proSubscription;
        break;

      case AccountTier.ShopOwner:
        price = Prices.shopOwnerSubscription;
        break;

      default:
        throw new Error('lol?');
    }

    if (!user.stripeCustomerId) {
      this.log.debug(
        `No Stripe customer associated with user "${user.username}". Creating one...`,
      );
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.profile.name,
      });
      await user.attachStripeCustomerId(customer.id);
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price,
        },
      ],
      mode: 'subscription',
      ui_mode: 'embedded',
    });

    this.log.log('Payment session created with customer ID:', session.customer);

    if (!session.client_secret) {
      throw new Error('Client secret was not returned.');
    }

    return session.client_secret;
  }

  async fulfillSessionOrder(user: User, sessionId: string): Promise<void> {
    this.log.debug('Retrieving Stripe session:', sessionId);
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    this.log.debug('Session payment status:', session.payment_status);

    if (session.payment_status === 'unpaid') {
      // TODO: What do I do here?
      throw new Error('Payment is still unpaid.');
    }

    if (!user.stripeCustomerId) {
      // If this user is new to Stripe we'll attach their Stripe customer ID to their user account
      // for future transactions.
      await user.attachStripeCustomerId(session.customer as string);
    } else if (user.stripeCustomerId !== session.customer) {
      // If the customer ID doesn't match what we have on file then there could be an issue here.
      // TODO: Need to figure out how to proceed.

      throw new Error('Uh oh!');
    }

    this.log.debug('Subscription ID:', session.subscription);

    const lineItem = session.line_items?.data[0];
    this.log.log(session.line_items?.data[0]);

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
