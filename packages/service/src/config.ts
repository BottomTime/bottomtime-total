/* eslint-disable no-process-env */
import 'dotenv-defaults/config';

function toNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
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
    return process.env.BT_SMTP_HOST ?? '';
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
    return process.env.BT_SMTP_REPLY_TO ?? '';
  }

  get from(): string {
    return process.env.BT_SMTP_FROM ?? '';
  }
}

class SessionsConfig {
  private static DefaultCookieTTL = 2 * 7 * 24 * 60; // Two weeks.

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
  static readonly github = new GithubConfig();
  static readonly google = new GoogleConfig();
  static readonly mail = new MailConfig();
  static readonly sessions = new SessionsConfig();

  /** The email address at which the site administrator(s) can be contacted. */
  static get adminEmail(): string {
    return process.env.BT_ADMIN_EMAIL ?? 'admin@bottomti.me';
  }

  /** The base URL at which the site will respond to requests. */
  static get baseUrl(): string {
    return process.env.BT_BASE_URL ?? 'http://localhost:8080/';
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

  static get mongoUri(): string {
    return (
      process.env.BT_MONGO_URI ?? 'mongodb://127.0.0.1:27017/bottomtime-local'
    );
  }

  static get passwordSaltRounds(): number {
    return toNumber(process.env.BT_PASSWORD_SALT_ROUNDS, 15);
  }

  /** Returns the TCP port number on which the service will listen for connections. */
  static get port(): number {
    return toNumber(process.env.BT_PORT, 4800);
  }
}

/** @deprecated Don't use default export anymore */
export default Config;
