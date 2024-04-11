/* eslint-disable no-process-env */
// import 'dotenv/config';
// function evaluateBoolean(
//   value: string | undefined,
//   defaultValue: boolean,
// ): boolean {
//   if (/^true|1$/i.test(value || '')) return true;
//   else if (/^false|0$/i.test(value || '')) return false;
//   else return defaultValue;
// }
// function toNumber(value: string | undefined, defaultValue: number): number {
//   if (!value) return defaultValue;
//   const parsed = parseInt(value);
//   return isNaN(parsed) ? defaultValue : parsed;
// }
// class AwsConfig {
//   get accessKeyId(): string {
//     return process.env.AWS_ACCESS_KEY_ID || '';
//   }
//   get secretAccessKey(): string {
//     return process.env.AWS_SECRET_ACCESS_KEY || '';
//   }
//   get region(): string {
//     return process.env.AWS_DEFAULT_REGION ?? 'us-east-1';
//   }
//   get s3Endpoint(): string | undefined {
//     return process.env.BT_AWS_S3_ENDPOINT || undefined;
//   }
//   get mediaBucket(): string {
//     return process.env.BT_AWS_MEDIA_BUCKET ?? 'bottomtime-media-local';
//   }
// }
// class GithubConfig {
//   get clientId(): string {
//     return process.env.BT_GITHUB_CLIENT_ID ?? '';
//   }
//   get clientSecret(): string {
//     return process.env.BT_GITHUB_CLIENT_SECRET ?? '';
//   }
// }
// class GoogleConfig {
//   get clientId(): string {
//     return process.env.BT_GOOGLE_CLIENT_ID ?? '';
//   }
//   get clientSecret(): string {
//     return process.env.BT_GOOGLE_CLIENT_SECRET ?? '';
//   }
// }
// class MailConfig {
//   get host(): string {
//     return process.env.BT_SMTP_HOST ?? 'email-smtp.us-east-1.amazonaws.com';
//   }
//   get port(): number {
//     return toNumber(process.env.BT_SMTP_PORT, 465);
//   }
//   get username(): string {
//     return process.env.BT_SMTP_USERNAME ?? '';
//   }
//   get password(): string {
//     return process.env.BT_SMTP_PASSWORD ?? '';
//   }
//   get replyTo(): string {
//     return process.env.BT_SMTP_REPLY_TO ?? 'donotreply@bottomti.me';
//   }
//   get from(): string {
//     return (
//       process.env.BT_SMTP_FROM ?? '"Bottom Time Admin" <admin@bottomti.me>'
//     );
//   }
// }
// class SessionsConfig {
//   private static DefaultCookieTTL = 14 * 24 * 60 * 60 * 1000; // Two weeks (in milliseconds).
//   /** Gets the domain name to which the session cookie will be scoped. */
//   get cookieDomain(): string | undefined {
//     return process.env.BT_SESSION_COOKIE_DOMAIN;
//   }
//   /** Gets the name of the session cookie. */
//   get cookieName(): string {
//     return process.env.BT_SESSION_COOKIE_NAME ?? 'bottomtime.local';
//   }
//   /** Gets the secret string used to sign the JWT token in the session cookie. */
//   get sessionSecret(): string {
//     return (
//       process.env.BT_SESSION_SECRET ??
//       'va20e0egr0aA/x2UFmckWDy1MYxoaZTaA2M4LGFli5k='
//     );
//   }
//   /** Gets the session cookie TTL in minutes */
//   get cookieTTL(): number {
//     return toNumber(
//       process.env.BT_SESSION_COOKIE_TTL,
//       SessionsConfig.DefaultCookieTTL,
//     );
//   }
// }
// export class Config {
//   static readonly aws = new AwsConfig();
//   static readonly github = new GithubConfig();
//   static readonly google = new GoogleConfig();
//   static readonly mail = new MailConfig();
//   static readonly sessions = new SessionsConfig();
//   /** The email address at which the site administrator(s) can be contacted. */
//   static get adminEmail(): string {
//     return (
//       process.env.BT_ADMIN_EMAIL ?? '"Bottom Time Admin" <admin@bottomti.me>'
//     );
//   }
//   /** The base URL at which the site will respond to requests. */
//   static get baseUrl(): string {
//     return process.env.BT_BASE_URL ?? 'http://localhost:8080/';
//   }
//   /**
//    * Use a faster (but lower quality) algorithm when resizing images. Default is "true".
//    * This is useful in testing but in production, this should be set to false to preserve image quality.
//    *
//    * Valid values are `true`, `false`, `1`, and `0`.
//    */
//   static get fastImageResize(): boolean {
//     return evaluateBoolean(process.env.BT_FAST_IMAGE_RESIZE, true);
//   }
//   /** Max number of friends any one user can have. */
//   static get friendsLimit(): number {
//     return toNumber(process.env.BT_FRIENDS_LIMIT, 1000);
//   }
//   /** True if NODE_ENV === 'production' */
//   static get isProduction(): boolean {
//     return this.env === 'production';
//   }
//   /** Email verification and password reset token TTL (in minutes). Default is 1,440 (one day). */
//   static get tokenTTL(): number {
//     return toNumber(process.env.BT_TOKEN_TTL, 1440);
//   }
//   /** Returns the value of $NODE_ENV! */
//   static get env(): string {
//     return process.env.NODE_ENV ?? 'local';
//   }
//   static get logLevel(): string {
//     return process.env.BT_LOG_LEVEL ?? 'debug';
//   }
//   static get passwordSaltRounds(): number {
//     return toNumber(process.env.BT_PASSWORD_SALT_ROUNDS, 15);
//   }
//   /** Returns the TCP port number on which the service will listen for connections. */
//   static get port(): number {
//     return toNumber(process.env.BT_PORT, 4800);
//   }
//   static get postgresUri(): string {
//     return (
//       process.env.BT_POSTGRES_URI ??
//       'postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_local'
//     );
//   }
// }
import 'dotenv/config';
import { z } from 'zod';

const LogLevelSchema = z.enum([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);
type LogLevel = z.infer<typeof LogLevelSchema>;

export interface AppConfig {
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3: {
      mediaBucket: string;
      endpoint?: string;
    };
  };

  github: {
    clientId: string;
    clientSecret: string;
  };

  google: {
    clientId: string;
    clientSecret: string;
  };

  mail: {
    host: string;
    port: number;
    username: string;
    password: string;
    replyTo: string;
    from: string;
  };

  sessions: {
    cookieDomain?: string;
    cookieName: string;
    sessionSecret: string;
    cookieTTL: number;
  };

  adminEmail: string;
  baseUrl: string;
  fastImageResize: boolean;
  friendsLimit: number;
  isProduction: boolean;
  tokenTTL: number;
  env: string;
  logLevel: LogLevel;
  passwordSaltRounds: number;
  port: number;
  postgresUri: string;
}

const ConfigSchema = z
  .object({
    // AWS
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_DEFAULT_REGION: z.string().default('us-east-1'),
    BT_AWS_S3_ENDPOINT: z.string().optional(),
    BT_AWS_MEDIA_BUCKET: z.string().default('bottomtime-media-local'),

    // Github
    BT_GITHUB_CLIENT_ID: z.string().default(''),
    BT_GITHUB_CLIENT_SECRET: z.string().default(''),

    // Google
    BT_GOOGLE_CLIENT_ID: z.string().default(''),
    BT_GOOGLE_CLIENT_SECRET: z.string().default(''),

    // SMTP
    BT_SMTP_HOST: z.string().default('email-smtp.us-east-1.amazonaws.com'),
    BT_SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(465),
    BT_SMTP_USERNAME: z.string().min(1),
    BT_SMTP_PASSWORD: z.string().min(1),
    BT_SMTP_REPLY_TO: z.string().default('donotreply@bottomti.me'),
    BT_SMTP_FROM: z.string().default('"Bottom Time Admin" <admin@bottomti.me>'),

    // Sessions
    BT_SESSION_COOKIE_DOMAIN: z.string().optional(),
    BT_SESSION_COOKIE_NAME: z.string().default('bottomtime.local'),
    BT_SESSION_SECRET: z
      .string()
      .default('va20e0egr0aA/x2UFmckWDy1MYxoaZTaA2M4LGFli5k='),
    BT_SESSION_COOKIE_TTL: z.coerce
      .number()
      .int()
      .min(1)
      .default(14 * 24 * 60 * 60 * 1000),

    // Misc.
    BT_ADMIN_EMAIL: z
      .string()
      .default('"Bottom Time Admin" <admin@bottomti.me>'),
    BT_BASE_URL: z.string().url().default('http://localhost:4850'),
    BT_FAST_IMAGE_RESIZE: z.coerce.boolean().default(true),
    BT_FRIENDS_LIMIT: z.coerce.number().int().min(1).max(5000).default(1000),
    BT_TOKEN_TTL: z.coerce.number().int().min(1).default(1440),
    BT_LOG_LEVEL: LogLevelSchema.default('debug'),
    BT_PASSWORD_SALT_ROUNDS: z.coerce.number().int().min(1).default(15),
    BT_PORT: z.coerce.number().int().min(1).max(65535).default(4800),
    BT_POSTGRES_URI: z
      .string()
      .default(
        'postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_local',
      ),
    NODE_ENV: z.string().default('local'),
  })
  .transform(
    (env): AppConfig => ({
      aws: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        region: env.AWS_DEFAULT_REGION,
        s3: {
          mediaBucket: env.BT_AWS_MEDIA_BUCKET,
          endpoint: env.BT_AWS_S3_ENDPOINT,
        },
      },

      github: {
        clientId: env.BT_GITHUB_CLIENT_ID,
        clientSecret: env.BT_GITHUB_CLIENT_SECRET,
      },

      google: {
        clientId: env.BT_GOOGLE_CLIENT_ID,
        clientSecret: env.BT_GOOGLE_CLIENT_SECRET,
      },

      mail: {
        host: env.BT_SMTP_HOST,
        port: env.BT_SMTP_PORT,
        username: env.BT_SMTP_USERNAME,
        password: env.BT_SMTP_PASSWORD,
        replyTo: env.BT_SMTP_REPLY_TO,
        from: env.BT_SMTP_FROM,
      },

      sessions: {
        cookieDomain: env.BT_SESSION_COOKIE_DOMAIN,
        cookieName: env.BT_SESSION_COOKIE_NAME,
        sessionSecret: env.BT_SESSION_SECRET,
        cookieTTL: env.BT_SESSION_COOKIE_TTL,
      },

      adminEmail: env.BT_ADMIN_EMAIL,
      baseUrl: env.BT_BASE_URL,
      fastImageResize: env.BT_FAST_IMAGE_RESIZE,
      friendsLimit: env.BT_FRIENDS_LIMIT,
      isProduction: env.NODE_ENV === 'production',
      tokenTTL: env.BT_TOKEN_TTL,
      env: env.NODE_ENV,
      logLevel: env.BT_LOG_LEVEL,
      passwordSaltRounds: env.BT_PASSWORD_SALT_ROUNDS,
      port: env.BT_PORT,
      postgresUri: env.BT_POSTGRES_URI,
    }),
  );

export const Config = ConfigSchema.parse(process.env);
