export enum EmailType {
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
  (ResetPasswordEmailOptions | VerifyEmailOptions | WelcomeEmailOptions);

export type EmailOptionsWithGlobals = EmailOptions & EmailGlobals;
