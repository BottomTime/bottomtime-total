/* eslint-disable no-process-env */
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
