import { AccountTier, FriendRequestDTO } from '@bottomtime/api';

import { User } from '../users';

export enum EventKey {
  FriendRequestAccepted = 'friendRequest.accepted',
  FriendRequestCreated = 'friendRequest.created',
  FriendRequestRejected = 'friendRequest.rejected',
  MembershipCanceled = 'membership.canceled',
  MembershipChanged = 'membership.changed',
  MembershipCreated = 'membership.created',
  MembershipInvoiceCreated = 'membership.invoiceCreated',
  MembershipPaymentFailed = 'membership.paymentFailed',
  MembershipTrialEnding = 'membership.trialEnding',
  UserCreated = 'user.created',
  UserPasswordResetRequest = 'user.passwordResetRequest',
  UserVerifyEmailRequest = 'user.verifyEmailRequest',

  Test = 'test.level.one',
  TestTwo = 'test.level.two',
}

export type FriendRequestEvent = {
  key:
    | EventKey.FriendRequestAccepted
    | EventKey.FriendRequestCreated
    | EventKey.FriendRequestRejected;
  user: User;
  friend: User;
  friendRequest: FriendRequestDTO;
};

export type MembershipCanceledEvent = {
  key: EventKey.MembershipCanceled;
  user: User;
  previousTier: AccountTier;
  previousTierName: string;
};

export type MembershipChangedEvent = {
  key: EventKey.MembershipChanged;
  user: User;
  newTier: AccountTier;
  newTierName: string;
  previousTier: AccountTier;
  previousTierName: string;
};

export type MembershipCreatedEvent = {
  key: EventKey.MembershipCreated;
  user: User;
  newTier: AccountTier;
  newTierName: string;
};

export type MembershipInvoiceCreatedEvent = {
  key: EventKey.MembershipInvoiceCreated;
  user: User;
  currency: string;
  invoiceDate: Date;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  totals: {
    discounts?: number;
    taxes?: number;
    subtotal: number;
    total: number;
  };
  amounts: {
    due: number;
    paid: number;
    remaining: number;
  };
  period?: {
    start: Date;
    end: Date;
  };
  downloadUrl?: string;
};

export type MembershipPaymentFailedEvent = {
  key: EventKey.MembershipPaymentFailed;
  user: User;
  amountDue: number;
  currency: string;
  dueDate: Date;
};

export type MembershipTrialEndingEvent = {
  key: EventKey.MembershipTrialEnding;
  user: User;
  currentTier: AccountTier;
  currentTierName: string;
  endDate: Date;
};

export type UserCreatedEvent = {
  key: EventKey.UserCreated;
  user: User;
  verificationToken: string;
  verificationUrl: string;
};

export type UserPasswordResetRequestEvent = {
  key: EventKey.UserPasswordResetRequest;
  user: User;
  resetToken: string;
  resetUrl: string;
};

export type UserVerifyEmailRequestEvent = {
  key: EventKey.UserVerifyEmailRequest;
  user: User;
  verificationToken: string;
  verificationUrl: string;
};

export type EventData =
  | FriendRequestEvent
  | MembershipCanceledEvent
  | MembershipChangedEvent
  | MembershipCreatedEvent
  | MembershipInvoiceCreatedEvent
  | MembershipPaymentFailedEvent
  | MembershipTrialEndingEvent
  | UserCreatedEvent
  | UserPasswordResetRequestEvent
  | UserVerifyEmailRequestEvent;
