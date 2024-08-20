import {
  AccountTier,
  MembershipStatus,
  MembershipStatusDTO,
} from '@bottomtime/api';

import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';

import Stripe from 'stripe';

import { Config } from '../config';
import { User } from '../users';
import { Prices } from './products';

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
  entitlements: [],
};

@Injectable()
export class MembershipService {
  private readonly log = new Logger(MembershipService.name);

  constructor(@Inject(Stripe) private readonly stripe: Stripe) {}

  private async ensureStripeCustomer(user: User): Promise<Stripe.Customer> {
    if (!user.email || !user.emailVerified) {
      throw new ForbiddenException('User must have a verified email address');
    }

    let customer: Stripe.Customer;

    if (user.stripeCustomerId) {
      const returnedCustomer = await this.stripe.customers.retrieve(
        user.stripeCustomerId,
        { expand: ['subscriptions'] },
      );

      if (returnedCustomer.deleted) {
        throw new Error(
          `Stripe customer with ID ${user.stripeCustomerId} was deleted and cannot be retrieved.`,
        );
      }

      customer = returnedCustomer;
    } else {
      this.log.debug(
        `No Stripe customer associated with user "${user.username}". Creating one...`,
      );
      customer = await this.stripe.customers.create({
        email: user.email,
        name: user.profile.name,
      });
      await user.attachStripeCustomerId(customer.id);
    }

    return customer;
  }

  private async createNewSubscription(
    customer: Stripe.Customer,
    accountTier: AccountTier,
  ): Promise<Stripe.Subscription> {
    const price = Prices[accountTier];

    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price, quantity: 1 }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  }

  private async changeSubscription(
    customer: Stripe.Customer,
    newAccountTier: AccountTier,
  ): Promise<Stripe.Subscription> {
    const price = Prices[newAccountTier];

    const subscription = customer.subscriptions?.data[0];
    if (!subscription) {
      throw new Error(
        'No subscription found to update. Did you mean to create a subscription?',
      );
    }

    const updated = await this.stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
      items: [{ id: subscription.items.data[0].id, price }],
    });

    return updated;
  }

  async getMembershipStatus(user: User): Promise<MembershipStatusDTO> {
    if (!user.stripeCustomerId) {
      // No Stripe customer. Default to free tier.
      return DefaultMembershipStatus;
    }

    const customer = await this.stripe.customers.retrieve(
      user.stripeCustomerId,
    );

    if (customer.deleted) {
      // Customer was deleted. Default to free tier.
      return DefaultMembershipStatus;
    }

    const entitlementsData =
      await this.stripe.entitlements.activeEntitlements.list({
        customer: user.stripeCustomerId,
      });

    const entitlements: string[] = [];
    let accountTier: AccountTier = AccountTier.Basic;
    for (const entitlement of entitlementsData.data) {
      entitlements.push(entitlement.lookup_key);
      if (entitlement.lookup_key === 'shop-owner-features') {
        accountTier = AccountTier.ShopOwner;
        break;
      }

      if (entitlement.lookup_key === 'pro-features') {
        accountTier = AccountTier.Pro;
      }
    }

    if (!customer.subscriptions?.data.length) {
      // No subscriptions. Default to free tier.
      return DefaultMembershipStatus;
    }

    const subscription = customer.subscriptions.data[0];
    const status = SubscriptionStatusMap[subscription.status];

    return {
      accountTier,
      cancellationDate: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : undefined,
      entitlements,
      nextBillingDate: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : undefined,
      status,
      trialEndDate: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : undefined,
    };
  }

  async updateMembership(
    user: User,
    newAccountTier: AccountTier,
  ): Promise<MembershipStatusDTO> {
    // TODO: Perform fulfillment.
    // TODO: Provision new account tier.
    // TODO: Log fulfillment status / payment status. (Database?)
    // TODO: Send an email to the user to confirm thier account status change.
    // TODO: Record/save fulfillment status for this Checkout Session

    if (newAccountTier === AccountTier.Basic) {
      // Cancel an existing membership.
      await this.cancelMembership(user);
    }

    const customer = await this.ensureStripeCustomer(user);

    if (customer.subscriptions?.data.length) {
      // Update the existing subscription.
      await this.changeSubscription(customer, newAccountTier);
    } else {
      // Create a new subscription.
      await this.createNewSubscription(customer, newAccountTier);
    }

    return await this.getMembershipStatus(user);
  }

  async getPaymentSecret(user: User): Promise<string | undefined> {
    if (!user.stripeCustomerId) return undefined;

    const customer = await this.stripe.customers.retrieve(
      user.stripeCustomerId,
      {
        expand: ['subscriptions.data.latest_invoice.payment_intent'],
      },
    );

    if (customer.deleted) return undefined;

    const subscription = customer.subscriptions?.data[0];
    if (!subscription) return undefined;

    const invoice = subscription.latest_invoice;
    if (!invoice || typeof invoice === 'string') return undefined;

    const paymentIntent = invoice.payment_intent;
    if (!paymentIntent || typeof paymentIntent === 'string') return undefined;

    if (!paymentIntent.client_secret) return undefined;

    return paymentIntent.client_secret;
  }

  async cancelMembership(user: User): Promise<boolean> {
    if (!user.stripeCustomerId) {
      this.log.debug(
        'User has no Stripe customer ID. No subscription to cancel.',
      );
      return false;
    }

    const customer = await this.stripe.customers.retrieve(
      user.stripeCustomerId,
      { expand: ['subscriptions'] },
    );
    if (customer.deleted) {
      this.log.debug('Stripe customer was deleted. No subscription to cancel.');
      return false;
    }

    const subscription = customer.subscriptions?.data[0];
    if (!subscription) {
      this.log.debug('Stripe customer has no subscriptions to cancel.');
      return false;
    }

    this.log.debug(
      `Cancelling subscription "${subscription.id}" for user "${user.username}"`,
    );
    await this.stripe.subscriptions.cancel(subscription.id);

    this.log.log(
      `Subscription (${subscription.id}) has been cancelled for user "${user.username}".`,
    );

    // TODO: Send a confirmation email to the user.

    return true;
  }

  parseWebhookEvent(payload: string, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      Config.stripeSdkKey,
    );
  }
}
