import { AccountTier } from '@bottomtime/api';
import { EmailQueueMessage, EmailType } from '@bottomtime/common';

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import dayjs from 'dayjs';
import Stripe from 'stripe';
import { URL } from 'url';

import { Queues } from '../common';
import { Config } from '../config';
import { InjectQueue, Queue } from '../queue';
import { User, UsersService } from '../users';
import { ProFeature, ShopOwnerFeature } from './constants';

type StripeEventHandler = (e: Stripe.Event) => Promise<void> | void;

@Injectable()
export class StripeWebhookService {
  private readonly log = new Logger(StripeWebhookService.name);

  private readonly EventMap: Record<string, StripeEventHandler> = {
    'customer.subscription.deleted': this.onSubscriptionCanceled,
    'customer.subscription.paused': this.onSubscriptionPaused,
    'customer.subscription.resumed': this.onSubscriptionResumed,
    'customer.subscription.trial_will_end': this.onTrialEnding,
    'customer.subscription.updated': this.onSubscriptionUpdated,
    'entitlements.active_entitlement_summary.updated':
      this.onEntitlementsChanged,
    'invoice.created': this.onInvoiceCreated,
    'invoice.finalized': this.onInvoiceFinalized,
    'invoice.finalization_failed': this.onInvoiceFinalizationFailed,
    'invoice.paid': this.onInvoicePaid,
    'invoice.payment_action_required': this.onPaymentActionRequired,
    'invoice.payment_failed': this.onPaymentFailed,
    'invoice.upcoming': this.onInvoiceUpcoming,
    'invoice.updated': this.onInvoiceUpdated,
  } as const;

  constructor(
    @Inject(Stripe) private readonly stripe: Stripe,
    @Inject(UsersService) private readonly users: UsersService,
    @InjectQueue(Queues.email) private readonly emailQueue: Queue,
  ) {}

  /**
   * Webhook handler for Stripe events.
   * @param payload The raw (text) payload from the request body.
   * @param signature The contents of the `Stripe-Signature` header.
   */
  async handleWebhookEvent(payload: string, signature: string): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      Config.stripe.webhookSigningSecret,
    );

    if (this.EventMap[event.type]) {
      this.log.debug('Received Stripe event:', event.type);
      await this.EventMap[event.type](event);
    } else {
      this.log.warn('Received Stripe event with no handler:', event.type);
    }
  }

  private async getUserFromStripeCustomer(
    customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
  ): Promise<User> {
    if (!customer) {
      throw new Error('No customer ID provided.');
    }

    const user =
      typeof customer === 'string'
        ? await this.users.getUserByStripeId(customer)
        : await this.users.getUserByStripeId(customer.id);

    if (!user) {
      throw new NotFoundException(
        `No user found matching Stripe customer ID: "${
          typeof customer === 'string' ? customer : customer.id
        }"`,
      );
    }

    return user;
  }

  private getAccountTierFromEntitlements(
    entitlements: Stripe.ApiList<Stripe.Entitlements.ActiveEntitlement>,
  ): AccountTier {
    let tier: AccountTier = AccountTier.Basic;

    const entitlementSet = new Set(entitlements.data.map((e) => e.lookup_key));
    if (entitlementSet.has(ProFeature)) tier = AccountTier.Pro;
    if (entitlementSet.has(ShopOwnerFeature)) tier = AccountTier.ShopOwner;

    return tier;
  }

  /* SUBSCRIPTIONS */
  /**
   * The user's subscription has been canceled in Stripe. (Either manually or for non-payment.)
   * Revoke their membership priveleges.
   */
  private async onSubscriptionCanceled(e: Stripe.Event): Promise<void> {
    if (e.type !== 'customer.subscription.deleted') return;

    const user = await this.getUserFromStripeCustomer(e.data.object.customer);
    await user.changeMembership(AccountTier.Basic);

    this.log.log(
      `Membership subscription was canceled for user "${user.username}". This occurred via Stripe.`,
    );

    // TODO: Send an email notification.
  }

  /**
   * Customer's subscription (and payments) were paused in Stripe. It may be resumed at a later date but
   * for now we need to revoke their paid membership priveleges.
   */
  private async onSubscriptionPaused(e: Stripe.Event): Promise<void> {
    if (e.type !== 'customer.subscription.paused') return;

    const user = await this.getUserFromStripeCustomer(e.data.object.customer);
    await user.changeMembership(AccountTier.Basic);

    this.log.log(
      `Membership subscription was paused for user "${user.username}". This occurred via Stripe.`,
    );
  }

  /**
   * A paused subscription was resumed via Stripe. We need to reinstate the user's paid membership privileges.
   */
  private async onSubscriptionResumed(e: Stripe.Event): Promise<void> {
    if (e.type !== 'customer.subscription.resumed') return;
    const user = await this.getUserFromStripeCustomer(e.data.object.customer);

    const customer =
      typeof e.data.object.customer === 'string'
        ? e.data.object.customer
        : e.data.object.customer.id;
    const entitlements = await this.stripe.entitlements.activeEntitlements.list(
      {
        customer,
      },
    );

    const newTier = this.getAccountTierFromEntitlements(entitlements);

    await user.changeMembership(newTier);

    this.log.log(
      `Stripe membership for user "${user.username}" was unpaused. User has been restored to account tier: ${newTier}`,
    );
  }

  private async onSubscriptionUpdated(e: Stripe.Event): Promise<void> {
    if (e.type !== 'customer.subscription.updated') return;

    // TODO: May not need to do anything here. Other event handlers will handle important cases.

    const user = await this.getUserFromStripeCustomer(e.data.object.customer);
    this.log.log(
      `Received notification from Stripe about update to subscription for user "${user.username}"`,
    );
  }

  private async onTrialEnding(e: Stripe.Event): Promise<void> {
    if (e.type !== 'customer.subscription.trial_will_end') return;

    // TODO: Send an email notification to the user that their trial is ending soon.
  }

  /* ENTITLEMENTS */
  /**
   * User entitlements have changed. This will correspond to a change in account tier.
   * Look up the user by their Stripe customer ID and update their account tier accordingly.
   */
  private async onEntitlementsChanged(e: Stripe.Event): Promise<void> {
    if (e.type !== 'entitlements.active_entitlement_summary.updated') return;
    const customer = e.data.object.customer;
    const entitlements = e.data.object.entitlements;

    const user = await this.getUserFromStripeCustomer(customer);
    const newTier = this.getAccountTierFromEntitlements(entitlements);

    await user.changeMembership(newTier);
  }

  /* INVOICES */
  private async onInvoiceCreated(e: Stripe.Event): Promise<void> {
    if (e.type !== 'invoice.created') return;
    /* TODO */
  }

  private async onInvoiceFinalized(e: Stripe.Event): Promise<void> {
    if (e.type !== 'invoice.finalized') return;
    /* TODO */
  }
  private async onInvoiceFinalizationFailed(e: Stripe.Event): Promise<void> {
    if (e.type !== 'invoice.finalization_failed') return;
    /* TODO */
  }
  private async onInvoiceUpcoming(e: Stripe.Event): Promise<void> {
    if (e.type !== 'invoice.upcoming') return;
    /* TODO */
  }
  private async onInvoiceUpdated(e: Stripe.Event): Promise<void> {
    if (e.type !== 'invoice.updated') return;
    /* TODO */
  }

  /* PAYMENTS */
  private async onInvoicePaid(e: Stripe.Event): Promise<void> {
    if (e.type !== 'invoice.paid') return;
    /* TODO */
  }
  private async onPaymentActionRequired(e: Stripe.Event): Promise<void> {
    if (e.type !== 'invoice.payment_action_required') return;
    /* TODO */
  }

  /**
   * Stripe has notified us of a failed payment. The user's membership may be suspended if they don't update
   * their payment info. Send them a notification via email.
   */
  private async onPaymentFailed(e: Stripe.Event): Promise<void> {
    if (e.type !== 'invoice.payment_failed') return;

    const user = await this.getUserFromStripeCustomer(e.data.object.customer);

    // Notify the user, via email, that their payment has failed.
    // They will be given a link to click where they can update their payment info.
    if (user.email) {
      const paymentDue = dayjs(
        e.data.object.next_payment_attempt || e.data.object.due_date || 0,
      ).format('LL');
      const emailOptions: EmailQueueMessage = {
        to: { to: user.email, cc: Config.adminEmail },
        subject: 'Important! Please update payment info',
        options: {
          type: EmailType.PaymentFailed,
          title: 'Payment Failed',
          user: {
            email: user.email,
            username: user.username,
            profile: {
              name: user.profile?.name || user.username,
            },
          },

          paymentUrl: new URL(
            '/membership/confirmation',
            Config.baseUrl,
          ).toString(),
          paymentAmount: Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: e.data.object.currency,
          }).format(e.data.object.amount_remaining / 100),
          paymentDue,
        },
      };

      this.log.log('Sending notification of failed payment to ', user.email);
      await this.emailQueue.add(JSON.stringify(emailOptions));
    }
  }
}
