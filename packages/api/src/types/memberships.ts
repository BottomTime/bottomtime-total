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
  cancellationDate: z.coerce.date().optional(),
  nextBillingDate: z.coerce.date().optional(),
  trialEndDate: z.coerce.date().optional(),
});
export type MembershipStatusDTO = z.infer<typeof MembershipStatusSchema>;

export const UpdateMembershipParamsSchema = z.object({
  newAccountTier: z.nativeEnum(AccountTier),
});
export type UpdateMembershipParamsDTO = z.infer<
  typeof UpdateMembershipParamsSchema
>;
