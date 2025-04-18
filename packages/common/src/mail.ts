export enum EmailType {
  Invoice = 'invoice',
  MembershipCanceled = 'membershipCanceled',
  MembershipChanged = 'membershipChanged',
  NewMembership = 'newMembership',
  PaymentFailed = 'paymentFailed',
  ResetPassword = 'resetPassword',
  TrialEnding = 'trialEnding',
  VerifyEmail = 'verifyEmail',
  Welcome = 'welcome',
}

export type EmailGlobals = {
  adminEmail: string;
  baseUrl: string;
  displayName: string;
  now: Date;
  year: number;
};

export type BaseEmailOptions = {
  title: string;
  subtitle?: string;
  user: {
    username: string;
    email: string;
    profile: {
      name: string;
    };
  };
};

export type InvoiceEmailOptions = {
  type: EmailType.Invoice;
  currency: string;
  invoiceDate: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }[];
  totals: {
    discounts?: string;
    taxes?: string;
    subtotal: string;
    total: string;
  };
  amounts: {
    due: string;
    paid: string;
    remaining: string;
  };
  period?: {
    start: string;
    end: string;
  };
  downloadUrl?: string;
};

export type MembershipCancelledEmailOptions = {
  type: EmailType.MembershipCanceled;
};

export type MembershipChangedEmailOptions = {
  type: EmailType.MembershipChanged;
  previousTier: string;
  newTier: string;
};

export type NewMembershipEmailOptions = {
  type: EmailType.NewMembership;
  newTier: string;
};

export type PaymentFailedEmailOptions = {
  type: EmailType.PaymentFailed;
  paymentAmount: string;
  paymentDue: string;
  paymentUrl: string;
};

export type ResetPasswordEmailOptions = {
  type: EmailType.ResetPassword;
  resetPasswordUrl: string;
};

export type TrialEndingEmailOptions = {
  type: EmailType.TrialEnding;
  endDate: string;
};

export type VerifyEmailOptions = {
  type: EmailType.VerifyEmail;
  verifyEmailUrl: string;
};

export type WelcomeEmailOptions = {
  type: EmailType.Welcome;
  logsUrl: string;
  profileUrl: string;
  verifyEmailUrl: string;
};

export type EmailOptions = BaseEmailOptions &
  (
    | InvoiceEmailOptions
    | MembershipCancelledEmailOptions
    | MembershipChangedEmailOptions
    | NewMembershipEmailOptions
    | PaymentFailedEmailOptions
    | ResetPasswordEmailOptions
    | TrialEndingEmailOptions
    | VerifyEmailOptions
    | WelcomeEmailOptions
  );

export type EmailOptionsWithGlobals = EmailOptions & EmailGlobals;

export type MailRecipients = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
};

export type EmailQueueMessage = {
  to: MailRecipients;
  subject: string;
  options: EmailOptions;
};
