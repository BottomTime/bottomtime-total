export enum EventKey {
  FriendRequestAccepted = 'friendRequest.accepted',
  FriendRequestCreated = 'friendRequest.created',
  FriendRequestRejected = 'friendRequest.rejected',

  DiveSiteCreated = 'diveSite.created',
  DiveSiteReviewAdded = 'diveSite.reviewAdded',
  DiveSiteReviewDeleted = 'diveSite.reviewDeleted',
  DiveSiteReviewModified = 'diveSite.reviewModified',

  MembershipCanceled = 'membership.canceled',
  MembershipChanged = 'membership.changed',
  MembershipCreated = 'membership.created',
  MembershipInvoiceCreated = 'membership.invoiceCreated',
  MembershipPaymentFailed = 'membership.paymentFailed',
  MembershipTrialEnding = 'membership.trialEnding',

  NotificationsDeleted = 'notifications.deleted',
  NotificationsDismissed = 'notifications.dismissed',
  NotificationsUndismissed = 'notifications.undismissed',

  UserCreated = 'user.created',
  UserPasswordResetRequest = 'user.passwordResetRequest',
  UserVerifyEmailRequest = 'user.verifyEmailRequest',
}
