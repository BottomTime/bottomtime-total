/* eslint-disable no-process-env */
import 'dotenv/config';

function evaluateBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (/^true|1$/i.test(value || '')) return true;
  else if (/^false|0$/i.test(value || '')) return false;
  else return defaultValue;
}

function toNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

class AwsConfig {
  get mediaBucket(): string {
    return process.env.BT_AWS_MEDIA_BUCKET ?? 'bottomtime-media-local';
  }

  get region(): string {
    return process.env.AWS_REGION ?? 'us-east-1';
  }
}

class GithubConfig {
  get clientId(): string {
    return process.env.BT_GITHUB_CLIENT_ID ?? '';
  }

  get clientSecret(): string {
    return process.env.BT_GITHUB_CLIENT_SECRET ?? '';
  }
}

class GoogleConfig {
  get clientId(): string {
    return process.env.BT_GOOGLE_CLIENT_ID ?? '';
  }

  get clientSecret(): string {
    return process.env.BT_GOOGLE_CLIENT_SECRET ?? '';
  }
}

class MailConfig {
  get host(): string {
    return process.env.BT_SMTP_HOST ?? 'email-smtp.us-east-1.amazonaws.com';
  }

  get port(): number {
    return toNumber(process.env.BT_SMTP_PORT, 465);
  }

  get username(): string {
    return process.env.BT_SMTP_USERNAME ?? '';
  }

  get password(): string {
    return process.env.BT_SMTP_PASSWORD ?? '';
  }

  get replyTo(): string {
    return process.env.BT_SMTP_REPLY_TO ?? 'donotreply@bottomti.me';
  }

  get from(): string {
    return (
      process.env.BT_SMTP_FROM ?? '"Bottom Time Admin" <admin@bottomti.me>'
    );
  }
}

class SessionsConfig {
  private static DefaultCookieTTL = 14 * 24 * 60 * 60 * 1000; // Two weeks (in milliseconds).

  /** Gets the domain name to which the session cookie will be scoped. */
  get cookieDomain(): string | undefined {
    return process.env.BT_SESSION_COOKIE_DOMAIN;
  }

  /** Gets the name of the session cookie. */
  get cookieName(): string {
    return process.env.BT_SESSION_COOKIE_NAME ?? 'bottomtime.local';
  }

  /** Gets the secret string used to sign the JWT token in the session cookie. */
  get sessionSecret(): string {
    return (
      process.env.BT_SESSION_SECRET ??
      'va20e0egr0aA/x2UFmckWDy1MYxoaZTaA2M4LGFli5k='
    );
  }

  /** Gets the session cookie TTL in minutes */
  get cookieTTL(): number {
    return toNumber(
      process.env.BT_SESSION_COOKIE_TTL,
      SessionsConfig.DefaultCookieTTL,
    );
  }
}

export class Config {
  static readonly aws = new AwsConfig();
  static readonly github = new GithubConfig();
  static readonly google = new GoogleConfig();
  static readonly mail = new MailConfig();
  static readonly sessions = new SessionsConfig();

  /** The email address at which the site administrator(s) can be contacted. */
  static get adminEmail(): string {
    return (
      process.env.BT_ADMIN_EMAIL ?? '"Bottom Time Admin" <admin@bottomti.me>'
    );
  }

  /** The base URL at which the site will respond to requests. */
  static get baseUrl(): string {
    return process.env.BT_BASE_URL ?? 'http://localhost:8080/';
  }

  /**
   * Use a faster (but lower quality) algorithm when resizing images. Default is "true".
   * This is useful in testing but in production, this should be set to false to preserve image quality.
   *
   * Valid values are `true`, `false`, `1`, and `0`.
   */
  static get fastImageResize(): boolean {
    return evaluateBoolean(process.env.BT_FAST_IMAGE_RESIZE, true);
  }

  /** Max number of friends any one user can have. */
  static get friendsLimit(): number {
    return toNumber(process.env.BT_FRIENDS_LIMIT, 1000);
  }

  /** True if NODE_ENV === 'production' */
  static get isProduction(): boolean {
    return this.env === 'production';
  }

  /** Email verification and password reset token TTL (in minutes). Default is 1,440 (one day). */
  static get tokenTTL(): number {
    return toNumber(process.env.BT_TOKEN_TTL, 1440);
  }

  /** Returns the value of $NODE_ENV! */
  static get env(): string {
    return process.env.NODE_ENV ?? 'local';
  }

  static get logLevel(): string {
    return process.env.BT_LOG_LEVEL ?? 'debug';
  }

  static get passwordSaltRounds(): number {
    return toNumber(process.env.BT_PASSWORD_SALT_ROUNDS, 15);
  }

  /** Returns the TCP port number on which the service will listen for connections. */
  static get port(): number {
    return toNumber(process.env.BT_PORT, 4800);
  }

  static get postgresUri(): string {
    return (
      process.env.BT_POSTGRES_URI ??
      'postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_local'
    );
  }
}
