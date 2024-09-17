import { AccountTier } from '@bottomtime/api';
import { EmailOptions, EmailQueueMessage, EmailType } from '@bottomtime/common';

import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import dayjs from 'dayjs';
import Stripe from 'stripe';
import { URL } from 'url';

import { Queues } from '../common';
import { Config } from '../config';
import { IQueue, InjectQueue } from '../queue';
import { User, UsersService } from '../users';
import { ProFeature, ShopOwnerFeature } from './constants';

type StripeEventHandler = (e: Stripe.Event) => Promise<void> | void;

const AccountTierFriendlyNames: Record<AccountTier, string> = {
  [AccountTier.Basic]: 'Free Account',
  [AccountTier.Pro]: 'Pro Membership',
  [AccountTier.ShopOwner]: 'Show Owner Membership',
} as const;

@Injectable()
export class StripeWebhookService {
  private readonly log = new Logger(StripeWebhookService.name);

  private readonly EventMap: Record<string, StripeEventHandler> = {
    'customer.subscription.deleted': this.onSubscriptionCanceled,
    'customer.subscription.trial_will_end': this.onTrialEnding,
    'entitlements.active_entitlement_summary.updated':
      this.onEntitlementsChanged,
    'invoice.created': this.onInvoiceCreated,
    'invoice.finalized': this.onInvoiceFinalized,
    'invoice.payment_action_required': this.onPaymentIssue,
    'invoice.payment_failed': this.onPaymentIssue,
  } as const;

  constructor(
    @Inject(Stripe) private readonly stripe: Stripe,
    @Inject(UsersService) private readonly users: UsersService,
    @InjectQueue(Queues.email) private readonly emailQueue: IQueue,
  ) {}

  /**
   * Webhook handler for Stripe events.
   * @param payload The raw (text) payload from the request body.
   * @param signature The contents of the `Stripe-Signature` header.
   */
  async handleWebhookEvent(payload: string, signature: string): Promise<void> {
    let event: Stripe.Event;
    try {
      this.log.debug(
        'Received webhook event from Stripe. Attempting to parse...',
      );
      event = await this.stripe.webhooks.constructEventAsync(
        payload,
        signature,
        Config.stripe.webhookSigningSecret,
      );
    } catch (error) {
      this.log.error(error);
      throw new BadRequestException('Invalid Stripe webhook signature.');
    }

    this.log.verbose({ event });

    if (this.EventMap[event.type]) {
      await this.EventMap[event.type].bind(this)(event);
    } else {
      this.log.warn('Received Stripe event with no handler:', event.type);
    }
  }

  private async getUserFromStripeCustomer(
    customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
  ): Promise<User> {
    if (!customer) {
      throw new BadRequestException('No customer ID provided.');
    }

    const user =
      typeof customer === 'string'
        ? await this.users.getUserByStripeId(customer)
        : await this.users.getUserByStripeId(customer.id);

    if (!user) {
      throw new BadRequestException(
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

    this.log.verbose('Entitlements:', entitlements.data);

    const entitlementSet = new Set(entitlements.data.map((e) => e.lookup_key));
    if (entitlementSet.has(ProFeature)) tier = AccountTier.Pro;
    if (entitlementSet.has(ShopOwnerFeature)) tier = AccountTier.ShopOwner;

    return tier;
  }

  private async sendEntitlementsChangedConfirmationEmail(
    user: User,
    oldTier: AccountTier,
  ): Promise<void> {
    if (!user.email) return;

    const userData: EmailOptions['user'] = {
      email: user.email,
      profile: {
        name: user.profile.name || user.username,
      },
      username: user.username,
    };
    let opts: EmailQueueMessage;

    if (user.accountTier === AccountTier.Basic) {
      // User's membership has been suspended or canceled. We won't send an email in this case since there could
      // be several reasons for this (user requested cancellation, payment failed, trial period ended, etc.).
      // We'll monitor for other events and send a more specific email if needed.
      return;
    }

    // Determine which email template to send.
    if (oldTier === AccountTier.Basic) {
      // User has created a brand new membership.
      opts = {
        to: { to: user.email },
        subject: 'Membership activated',
        options: {
          type: EmailType.NewMembership,
          newTier: AccountTierFriendlyNames[user.accountTier],
          title: 'Membership activated!',
          user: userData,
        },
      };
    } else {
      // User has upgraded or downgraded their membership tier.
      opts = {
        to: { to: user.email },
        subject: 'Membership updated',
        options: {
          type: EmailType.MembershipChanged,
          newTier: AccountTierFriendlyNames[user.accountTier],
          previousTier: AccountTierFriendlyNames[oldTier],
          title: 'Membership Updated',
          user: {
            email: user.email,
            username: user.username,
            profile: {
              name: user.profile?.name || user.username,
            },
          },
        },
      };
    }

    this.sendEmail(opts);
  }

  private sendEmail(payload: unknown): void {
    this.emailQueue.add(JSON.stringify(payload)).catch((error) => {
      this.log.error('Failed to send email:', error);
    });
  }

  /* SUBSCRIPTIONS */
  /**
   * Occurs whenever a customer’s subscription ends.
   * We'll send a confirmation email to the user.
   */
  private async onSubscriptionCanceled(e: Stripe.Event): Promise<void> {
    if (e.type !== 'customer.subscription.deleted') return;

    const user = await this.getUserFromStripeCustomer(e.data.object.customer);
    if (!user.email) {
      this.log.warn(
        `Received subscription canceled event for "${user.username}", but no email address is available to notify them.`,
      );
      return;
    }

    const message: EmailQueueMessage = {
      to: { to: user.email },
      subject: 'Membership canceled',
      options: {
        type: EmailType.MembershipCanceled,
        title: 'Membership Canceled',
        user: {
          email: user.email,
          username: user.username,
          profile: {
            name: user.profile?.name || user.username,
          },
        },
      },
    };

    this.sendEmail(message);
  }

  /**
   * Occurs whenever a customer’s entitlements change.
   * This will monitor changes in users' account tiers and provision/deprovision features as needed.
   */
  private async onEntitlementsChanged(e: Stripe.Event): Promise<void> {
    if (e.type !== 'entitlements.active_entitlement_summary.updated') return;

    const user = await this.getUserFromStripeCustomer(e.data.object.customer);
    const oldTier = user.accountTier;
    const newTier = this.getAccountTierFromEntitlements(
      e.data.object.entitlements,
    );

    if (oldTier === newTier) {
      this.log.debug(
        `Received entitlements change event for "${user.username}", but no change is required in their account tier.`,
      );
      return;
    }

    await user.changeMembership(newTier);
    await this.sendEntitlementsChangedConfirmationEmail(user, oldTier);

    this.log.log(
      `Received entitlements change event for "${user.username}". Changed account tier from "${AccountTierFriendlyNames[oldTier]}" to "${AccountTierFriendlyNames[newTier]}".`,
    );
  }

  /**
   * Free trial period is ending in 3 days. Send the user a notification... if we don't
   * have payment details ask the user to update them.
   */
  private async onTrialEnding(e: Stripe.Event): Promise<void> {
    if (e.type !== 'customer.subscription.trial_will_end') return;

    const user = await this.getUserFromStripeCustomer(e.data.object.customer);
    if (!user.email || !e.data.object.trial_end) return;

    const message: EmailQueueMessage = {
      to: { to: user.email },
      subject: 'Your free trial of Bottom Time is ending soon...',
      options: {
        type: EmailType.TrialEnding,
        endDate: dayjs(e.data.object.trial_end * 1000).format('LL'),
        title: 'Your Trial Period Is Ending Soon',
        user: {
          email: user.email,
          profile: {
            name: user.profile.name || user.username,
          },
          username: user.username,
        },
      },
    };

    this.sendEmail(message);
  }

  /* INVOICES */
  /** Occurs whenever a new invoice is created. */
  private async onInvoiceCreated(e: Stripe.Event): Promise<void> {
    if (e.type !== 'invoice.created') return;

    await this.stripe.invoices.finalizeInvoice(e.data.object.id, {
      auto_advance: true,
    });

    this.log.debug(`Finalized invoice "${e.data.object.id}"`);
  }

  /**
   * Occurs whenever a draft invoice is finalized and updated to be an open invoice.
   * We'll send the user an email detailing the payment.
   */
  private async onInvoiceFinalized(e: Stripe.Event): Promise<void> {
    if (e.type !== 'invoice.finalized') return;

    const user = await this.getUserFromStripeCustomer(e.data.object.customer);
    if (!user.email) {
      this.log.warn(
        `Received finalized invoice event for "${user.username}", but no email address is available to notify them.`,
      );
      return;
    }

    const currency = Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: e.data.object.currency,
    });
    const totalDiscounts = e.data.object.total_discount_amounts?.reduce(
      (total, value) => total + value.amount / 100,
      0,
    );
    const totalTaxes = e.data.object.total_tax_amounts?.reduce(
      (total, value) => total + value.amount / 100,
      0,
    );
    const period = e.data.object.lines.data.find((line) => line.period)?.period;
    const message: EmailQueueMessage = {
      to: { to: user.email, bcc: Config.adminEmail },
      subject: 'Latest invoice for Bottom Time membership',
      options: {
        type: EmailType.Invoice,
        title: 'Bottom Time Membership',
        subtitle: 'Your Latest Invoice',
        invoiceDate: dayjs(
          e.data.object.effective_at || e.data.object.created,
        ).format('LLL'),
        user: {
          email: user.email,
          username: user.username,
          profile: {
            name: user.profile?.name || user.username,
          },
        },
        currency: e.data.object.currency.toUpperCase(),
        downloadUrl: e.data.object.invoice_pdf ?? undefined,
        items: e.data.object.lines.data.map((line) => ({
          description: line.description || '',
          quantity: line.quantity ?? 1,
          unitPrice: currency.format(
            parseFloat(line.unit_amount_excluding_tax || '0') / 100,
          ),
          total: currency.format(
            (line.amount_excluding_tax ?? line.amount) / 100,
          ),
        })),
        amounts: {
          due: currency.format(e.data.object.amount_due / 100),
          paid: currency.format(e.data.object.amount_paid / 100),
          remaining: currency.format(e.data.object.amount_remaining / 100),
        },
        totals: {
          subtotal: currency.format(e.data.object.subtotal / 100),
          total: currency.format(e.data.object.total / 100),
          discounts: totalDiscounts
            ? currency.format(totalDiscounts)
            : undefined,
          taxes: totalTaxes ? currency.format(totalTaxes) : undefined,
        },
        period: period
          ? {
              start: dayjs(period.start).format('LL'),
              end: dayjs(period.end).format('LL'),
            }
          : undefined,
      },
    };

    this.sendEmail(message);
  }

  /**
   * - `invoice.payment_action_required`: Sent when the invoice requires customer authentication.
   * - `invoice.payment_failed`: A payment for an invoice failed. The PaymentIntent status changes to `requires_action`.
   */
  private async onPaymentIssue(e: Stripe.Event): Promise<void> {
    if (
      e.type !== 'invoice.payment_action_required' &&
      e.type !== 'invoice.payment_failed'
    ) {
      return;
    }

    const user = await this.getUserFromStripeCustomer(e.data.object.customer);

    // Notify the user, via email, that their payment has failed or needs attention.
    // They will be given a link to click where they can update their payment info.
    if (user.email) {
      const paymentDue = dayjs(
        e.data.object.next_payment_attempt || e.data.object.due_date || 0,
      ).format('LL');
      const emailOptions: EmailQueueMessage = {
        to: { to: user.email, cc: Config.adminEmail },
        subject: 'Important! Please update your payment info.',
        options: {
          type: EmailType.PaymentFailed,
          title: 'Payment Issue',
          subtitle: 'Your Attention is Required ⚠️',
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

      this.log.log(
        `Sending notification of failed/stalled payment to "${user.username}".`,
        user.email,
      );
      this.sendEmail(emailOptions);
    }
  }
}
