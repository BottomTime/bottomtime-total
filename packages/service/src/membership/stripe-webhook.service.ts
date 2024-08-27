import { Inject, Injectable, Logger } from '@nestjs/common';

import Stripe from 'stripe';

import { Config } from '../config';

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

  constructor(@Inject(Stripe) private readonly stripe: Stripe) {}

  async handleWebhookEvent(payload: string, signature: string): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      Config.stripe.sdkKey,
    );

    if (this.EventMap[event.type]) {
      this.log.debug('Received Stripe event:', event.type);
      await this.EventMap[event.type](event);
    } else {
      this.log.warn('Received Stripe event with no handler:', event.type);
    }
  }

  /* SUBSCRIPTIONS */
  private async onSubscriptionCanceled(e: Stripe.Event): Promise<void> {}
  private async onSubscriptionPaused(e: Stripe.Event): Promise<void> {}
  private async onSubscriptionResumed(e: Stripe.Event): Promise<void> {}
  private async onSubscriptionUpdated(e: Stripe.Event): Promise<void> {}
  private async onTrialEnding(e: Stripe.Event): Promise<void> {}

  /* ENTITLEMENTS */
  private async onEntitlementsChanged(e: Stripe.Event): Promise<void> {
    const event = e as Stripe.EntitlementsActiveEntitlementSummaryUpdatedEvent;
    const customer = event.data.object.customer;
    const entitlements = event.data.object.entitlements;

    // Do something with the customer and entitlement
  }

  /* INVOICES */
  private async onInvoiceCreated(e: Stripe.Event): Promise<void> {}
  private async onInvoiceFinalized(e: Stripe.Event): Promise<void> {}
  private async onInvoiceFinalizationFailed(e: Stripe.Event): Promise<void> {}
  private async onInvoiceUpcoming(e: Stripe.Event): Promise<void> {}
  private async onInvoiceUpdated(e: Stripe.Event): Promise<void> {}

  /* PAYMENTS */
  private async onInvoicePaid(e: Stripe.Event): Promise<void> {}
  private async onPaymentActionRequired(e: Stripe.Event): Promise<void> {}
  private async onPaymentFailed(e: Stripe.Event): Promise<void> {}
}
