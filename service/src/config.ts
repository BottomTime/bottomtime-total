/* eslint-disable no-process-env */
import 'dotenv-defaults/config';

function toNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

class MailConfig {
  get host(): string {
    return process.env.BT_SMTP_HOST ?? '';
  }

  get port(): number {
    return toNumber(process.env.BT_SMTP_PORT, 587);
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

  /** Gets the secret string used to encrypt the session cookie contents. */
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

class Config {
  readonly mail = new MailConfig();
  readonly sessions = new SessionsConfig();

  /** Max number of friends any one user can have. */
  get friendsLimit(): number {
    return toNumber(process.env.BT_FRIENDS_LIMIT, 1000);
  }

  /** True if NODE_ENV === 'production' */
  get isProduction(): boolean {
    return this.env === 'production';
  }

  /** Email verification and password reset token TTL (in minutes). Default is 1,440 (one day). */
  get tokenTTL(): number {
    return toNumber(process.env.BT_TOKEN_TTL, 1440);
  }

  /** Returns the value of $NODE_ENV! */
  get env(): string {
    return process.env.NODE_ENV ?? 'local';
  }

  get logLevel(): string {
    return process.env.BT_LOG_LEVEL ?? 'debug';
  }

  get mongoUri(): string {
    return (
      process.env.BT_MONGO_URI ?? 'mongodb://127.0.0.1:27017/bottomtime-local'
    );
  }

  get passwordSaltRounds(): number {
    return toNumber(process.env.BT_PASSWORD_SALT_ROUNDS, 15);
  }

  /** Returns the TCP port number on which the service will listen for connections. */
  get port(): number {
    return toNumber(process.env.BT_PORT, 4800);
  }
}

export default new Config();
