import { z } from 'zod';

export enum AccountTier {
  Basic = 0,
  Pro = 100,
  ShopOwner = 200,
}

export enum BillingFrequency {
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Year = 'year',
}

export enum MembershipStatus {
  /** User has not signed up for a paid membership yet or is not yet registered with Stripe. Free tier only! */
  None = 'none',

  /**
   * A successful payment needs to be made within 23 hours to activate the subscription. Or the payment requires action,
   * like customer authentication. Subscriptions can also be incomplete if there’s a pending payment and the PaymentIntent
   * status would be processing.
   */
  Incomplete = 'incomplete',

  /**
   * The initial payment on the subscription failed and no successful payment was made within 23 hours of creating the subscription.
   * These subscriptions don’t bill customers. This status exists so you can track customers that failed to activate their subscriptions.
   */
  Expired = 'expired',

  /**
   * The subscription is currently in a trial period and it’s safe to
   * provision your product for your customer. The subscription transitions automatically to active when the first payment is made.
   */
  Trialing = 'trialing',

  /**
   * The subscription is in good standing and the most recent payment is successful. It’s safe to provision your product for your customer.
   */
  Active = 'active',

  /**
   * Payment on the latest finalized invoice either failed or wasn’t attempted. The subscription continues to create invoices.
   * Your subscription settings determine the subscription’s next state. If the invoice is still unpaid after all Smart Retries
   * have been attempted, you can configure the subscription to move to canceled, unpaid, or leave it as past_due.
   * To move the subscription to active, pay the most recent invoice before its due date.
   */
  PastDue = 'pastDue',

  /**
   * The subscription has been canceled. During cancellation, automatic collection for all unpaid invoices is disabled (auto_advance=false).
   * This is a terminal state that can’t be updated.
   */
  Canceled = 'canceled',

  /**
   * The latest invoice hasn’t been paid but the subscription remains in place. The latest invoice remains open and invoices continue to be
   * generated but payments aren’t attempted. You should revoke access to your product when the subscription is unpaid since payments were
   * already attempted and retried when it was past_due. To move the subscription to active, pay the most recent invoice before its due date.
   */
  Unpaid = 'unpaid',

  /**
   * The subscription has ended its trial period without a default payment method and the trial_settings.end_behavior.missing_payment_method
   * is set to pause. Invoices will no longer be created for the subscription. After a default payment method has been attached to the
   * customer, you can resume the subscription.
   */
  Paused = 'paused',
}

export const PaymentSessionSchema = z.object({
  clientSecret: z.string(),
  products: z
    .object({
      product: z.string(),
      price: z.number(),
    })
    .array(),
  currency: z.string(),
  tax: z.number().optional(),
  total: z.number(),
  discounts: z.number().optional(),
  frequency: z.nativeEnum(BillingFrequency),
});
export type PaymentSessionDTO = z.infer<typeof PaymentSessionSchema>;

export const MembershipSchema = z.object({
  accountTier: z.nativeEnum(AccountTier),
  name: z.string(),
  description: z.string().optional(),
  marketingFeatures: z.string().array().optional(),
  price: z.number(),
  currency: z.string(),
  frequency: z.nativeEnum(BillingFrequency),
});
export type MembershipDTO = z.infer<typeof MembershipSchema>;

export const ListMembershipsResponseSchema = MembershipSchema.array();
export type ListMembershipsResponseDTO = z.infer<
  typeof ListMembershipsResponseSchema
>;

export const MembershipStatusSchema = z.object({
  accountTier: z.nativeEnum(AccountTier),
  entitlements: z.string().array(),
  status: z.nativeEnum(MembershipStatus),
  cancellationDate: z.number().optional(),
  nextBillingDate: z.number().optional(),
  trialEndDate: z.number().optional(),
});
export type MembershipStatusDTO = z.infer<typeof MembershipStatusSchema>;

export const UpdateMembershipParamsSchema = z.object({
  newAccountTier: z.nativeEnum(AccountTier),
});
export type UpdateMembershipParamsDTO = z.infer<
  typeof UpdateMembershipParamsSchema
>;
