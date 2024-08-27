/* eslint-disable no-console */
import Stripe from 'stripe';

export async function createWebhookEndpoint(sdkKey: string, url: string) {
  try {
    const stripe = new Stripe(sdkKey);

    console.log('Provisioning webhook endpoint for ', url, '...');
    const result = await stripe.webhookEndpoints.create({
      url,
      enabled_events: [
        'customer.subscription.deleted',
        'customer.subscription.paused',
        'customer.subscription.resumed',
        'entitlements.active_entitlement_summary.updated',
        'invoice.created',
        'invoice.finalization_failed',
        'invoice.finalized',
        'invoice.paid',
        'invoice.payment_action_required',
        'invoice.payment_failed',
        'invoice.upcoming',
        'invoice.updated',
      ],
    });

    console.log('New webhook endpoint created at:');
    console.log(result.url);
    console.log('\nSigning secret:');
    console.log(result.secret);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
