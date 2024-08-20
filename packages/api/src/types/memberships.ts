import { z } from 'zod';

import { AccountTier } from './users';

export enum MembershipStatus {
  /** User has not signed up for a paid membership yet: free tier only */
  None = 'none',

  /** Payment information is required before the membership can be activated. */
  Incomplete = 'incomplete',

  /** Trial period expired before billing information was provided. */
  Expired = 'expired',

  /** Active in free trial mode. */
  Trialing = 'trialing',

  /** Membership is active and in good standing. */
  Active = 'active',

  /** Payment is currently past due. */
  PastDue = 'pastDue',

  /** Membership has been cancelled. */
  Canceled = 'canceled',

  /** Payment failed. */
  Unpaid = 'unpaid',

  /** Membership (and related payments) are temporarily paused. */
  Paused = 'paused',
}

export const CreatePaymentSessionResponseSchema = z.object({
  clientSecret: z.string(),
});
export type CreatePaymentSessionResponseDTO = z.infer<
  typeof CreatePaymentSessionResponseSchema
>;

export const MembershipStatusSchema = z.object({
  accountTier: z.nativeEnum(AccountTier).default(AccountTier.Basic),
  cancellationDate: z.coerce.date().optional(),
  entitlements: z.string().array(),
  nextBillingDate: z.coerce.date().optional(),
  status: z.nativeEnum(MembershipStatus),
  trialEndDate: z.coerce.date().optional(),
});
export type MembershipStatusDTO = z.infer<typeof MembershipStatusSchema>;

export const PaymentSessionSchema = z.object({
  sessionId: z.string(),
  user: z.object({
    userId: z.string(),
    email: z.string(),
  }),
  status: z.string(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
});
export type PaymentSessionDTO = z.infer<typeof PaymentSessionSchema>;

export const UpdateMembershipParamsSchema = z.object({
  newAccountTier: z.nativeEnum(AccountTier),
});
export type UpdateMembershipParamsDTO = z.infer<
  typeof UpdateMembershipParamsSchema
>;
