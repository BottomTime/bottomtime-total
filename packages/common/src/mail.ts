export enum EmailType {
  PaymentFailed = 'paymentFailed',
  ResetPassword = 'resetPassword',
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
    | PaymentFailedEmailOptions
    | ResetPasswordEmailOptions
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
