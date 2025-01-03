import { AccountTier, FriendRequestDTO } from '@bottomtime/api';
import { EventKey } from '@bottomtime/common';

import { User } from '../users';

export type DiveSiteReviewEvent = {
  key:
    | EventKey.DiveSiteReviewAdded
    | EventKey.DiveSiteReviewDeleted
    | EventKey.DiveSiteReviewModified;
  diveSite: {
    id: string;
    name: string;
  };
  rating: number;
  comments?: string;
};

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

export type NotificationManagementEvent = {
  key:
    | EventKey.NotificationsDeleted
    | EventKey.NotificationsDismissed
    | EventKey.NotificationsUndismissed;
  user: User;
  notificationIds: string[];
};

export type OperatorReviewEvent = {
  key:
    | EventKey.OperatorReviewAdded
    | EventKey.OperatorReviewDeleted
    | EventKey.OperatorReviewModified;
  operator: {
    id: string;
    name: string;
    slug: string;
  };
  rating: number;
  comments?: string;
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
  | DiveSiteReviewEvent
  | FriendRequestEvent
  | MembershipCanceledEvent
  | MembershipChangedEvent
  | MembershipCreatedEvent
  | MembershipInvoiceCreatedEvent
  | MembershipPaymentFailedEvent
  | MembershipTrialEndingEvent
  | NotificationManagementEvent
  | OperatorReviewEvent
  | UserCreatedEvent
  | UserPasswordResetRequestEvent
  | UserVerifyEmailRequestEvent;
