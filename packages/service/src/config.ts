/* eslint-disable no-process-env */
import { z } from 'zod';

import 'dotenv-defaults/config';

const ConfigSchema = z
  .object({
    // General config
    BT_ADMIN_EMAIL: z.string().email().default('admin@bottomti.me'),
    BT_BASE_URL: z.string().url().default('http://localhost:8080/'),
    BT_FRIENDS_LIMIT: z.coerce.number().int().positive().default(1000),
    BT_LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
      .default('info'),
    BT_MONGO_URI: z
      .string()
      .default('mongodb://127.0.0.1:27017/bottomtime-local'),
    BT_PASSWORD_SALT_ROUNDS: z.coerce.number().int().positive().default(15),
    BT_PORT: z.coerce.number().int().positive().default(4800),
    NODE_ENV: z.string().default('local'),

    // Session Cookie
    BT_SESSION_COOKIE_DOMAIN: z.string().optional(),
    BT_SESSION_COOKIE_NAME: z.string().default('bottomtime.local'),
    BT_SESSION_SECRET: z.string().min(8),
    BT_SESSION_COOKIE_TTL: z
      .number()
      .int()
      .positive()
      .default(14 * 24 * 60),

    // SMTP/Email config
    BT_SMTP_HOST: z.string().url(),
  })
  .transform((obj) => ({
    adminEmail: obj.BT_ADMIN_EMAIL,
    baseUrl: obj.BT_BASE_URL,
    friendsLimit: obj.BT_FRIENDS_LIMIT,
    logLevel: obj.BT_LOG_LEVEL,
    isProduction: obj.NODE_ENV === 'production',
    mongoUri: obj.BT_MONGO_URI,
    passwordSaltRounds: obj.BT_PASSWORD_SALT_ROUNDS,
    port: obj.BT_PORT,
    env: obj.NODE_ENV,

    mail: {
      host: obj.BT_SMTP_HOST,
    },

    sessions: {
      cookieDomain: obj.BT_SESSION_COOKIE_DOMAIN,
      cookieName: obj.BT_SESSION_COOKIE_NAME,
      sessionSecret: obj.BT_SESSION_SECRET,
      cookieTTL: obj.BT_SESSION_COOKIE_TTL,
    },
  }));
export type AppConfig = z.infer<typeof ConfigSchema>;

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
