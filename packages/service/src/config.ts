/* eslint-disable no-process-env */
import { BooleanString } from '@bottomtime/api';

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
    region: string;
    s3: {
      mediaBucket: string;
      endpoint?: string;
    };
    sqs: {
      emailQueueUrl: string;
      endpoint?: string;
      reviewsQueueUrl: string;
    };
  };

  edgeAuth: {
    audience: string;
    cookieName: string;
    enabled: boolean;
    sessionSecret: string;
  };

  discord: {
    clientId?: string;
    clientSecret?: string;
  };

  github: {
    clientId?: string;
    clientSecret?: string;
  };

  google: {
    clientId?: string;
    clientSecret?: string;
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
    cookieDomain: string;
    cookieName: string;
    sessionSecret: string;
    cookieTTL: number;
    secureCookie: boolean;
  };

  stripe: {
    sdkKey: string;
    webhookSigningSecret: string;
  };

  adminEmail: string;
  baseUrl: string;
  configCatSdkKey: string;
  friendsLimit: number;
  isProduction: boolean;
  env: string;
  ipGeolocationApiKey?: string;
  logLevel: LogLevel;
  passwordSaltRounds: number;
  port: number;
  postgresRequireSsl: boolean;
  postgresUri: string;
  redisUri: string;
}

const ConfigSchema = z
  .object({
    // AWS
    AWS_REGION: z.string().default('us-east-1'),
    BT_AWS_S3_ENDPOINT: z.string().optional(),
    BT_AWS_MEDIA_BUCKET: z.string().default('media'),
    BT_AWS_SQS_EMAIL_QUEUE_URL: z
      .string()
      .default('http://localstack:4566/000000000000/email'),
    BT_AWS_SQS_ENDPOINT: z.string().optional(),
    BT_AWS_SQS_REVIEWS_QUEUE_URL: z
      .string()
      .default('http://localstack:4566/000000000000/reviews'),

    // Edge authorization
    BT_EDGEAUTH_AUDIENCE: z.string().default('dev.bottomti.me'),
    BT_EDGEAUTH_ENABLED: BooleanString.default('false'),
    BT_EDGEAUTH_COOKIE_NAME: z.string().default('bottomtime.auth'),
    BT_EDGEAUTH_SESSION_SECRET: z
      .string()
      .default(
        'nxS0JJ04kNjiZpJxQz5iq6OFoN6bAvsQxO2eVLGaSQyslZU8ltxqYlmKUIon9B8scg89VBg3eFZAs6umkWUYWQ',
      ),

    // Discord
    BT_DISCORD_CLIENT_ID: z.string().optional(),
    BT_DISCORD_CLIENT_SECRET: z.string().optional(),

    // Github
    BT_GITHUB_CLIENT_ID: z.string().optional(),
    BT_GITHUB_CLIENT_SECRET: z.string().optional(),

    // Google
    BT_GOOGLE_CLIENT_ID: z.string().optional(),
    BT_GOOGLE_CLIENT_SECRET: z.string().optional(),

    // SMTP
    BT_SMTP_HOST: z.string().default('email-smtp.us-east-1.amazonaws.com'),
    BT_SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(465),
    BT_SMTP_USERNAME: z.string().min(1),
    BT_SMTP_PASSWORD: z.string().min(1),
    BT_SMTP_REPLY_TO: z.string().default('donotreply@bottomti.me'),
    BT_SMTP_FROM: z.string().default('"Bottom Time Admin" <admin@bottomti.me>'),

    // Sessions
    BT_SESSION_COOKIE_DOMAIN: z.string().default('localhost'),
    BT_SESSION_COOKIE_NAME: z.string().default('bottomtime.local'),
    BT_SESSION_SECRET: z
      .string()
      .default('va20e0egr0aA/x2UFmckWDy1MYxoaZTaA2M4LGFli5k='),
    BT_SESSION_SECURE_COOKIE: BooleanString.default('false'),
    BT_SESSION_COOKIE_TTL: z.coerce
      .number()
      .int()
      .min(1)
      .default(14 * 24 * 60 * 60 * 1000),

    // Stripe
    BT_STRIPE_SDK_KEY: z.string().default(''),
    BT_STRIPE_WEBHOOK_SECRET: z.string().default(''),

    // Misc.
    BT_ADMIN_EMAIL: z.string().default('admin@bottomti.me'),
    BT_BASE_URL: z.string().url().default('http://localhost:4850'),
    BT_CONFIGCAT_SDK_KEY: z.string().default(''),
    BT_FRIENDS_LIMIT: z.coerce.number().int().min(1).max(5000).default(1000),
    BT_IPGEOLOCATION_API_KEY: z.string().optional(),
    BT_LOG_LEVEL: LogLevelSchema.default('debug'),
    BT_PASSWORD_SALT_ROUNDS: z.coerce.number().int().min(1).default(15),
    BT_PORT: z.coerce.number().int().min(1).max(65535).default(4800),
    BT_POSTGRES_REQUIRE_SSL: BooleanString.default('false'),
    BT_POSTGRES_URI: z
      .string()
      .default(
        'postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_local',
      ),
    BT_REDIS_URI: z.string().default('redis://localhost:6379/0'),
    NODE_ENV: z.string().default('local'),
  })
  .transform<AppConfig>((env) => ({
    aws: {
      region: env.AWS_REGION,
      s3: {
        mediaBucket: env.BT_AWS_MEDIA_BUCKET,
        endpoint: env.BT_AWS_S3_ENDPOINT,
      },
      sqs: {
        emailQueueUrl: env.BT_AWS_SQS_EMAIL_QUEUE_URL,
        endpoint: env.BT_AWS_SQS_ENDPOINT,
        reviewsQueueUrl: env.BT_AWS_SQS_REVIEWS_QUEUE_URL,
      },
    },

    edgeAuth: {
      audience: env.BT_EDGEAUTH_AUDIENCE,
      cookieName: env.BT_EDGEAUTH_COOKIE_NAME,
      enabled: env.BT_EDGEAUTH_ENABLED,
      sessionSecret: env.BT_EDGEAUTH_SESSION_SECRET,
    },

    github: {
      clientId: env.BT_GITHUB_CLIENT_ID,
      clientSecret: env.BT_GITHUB_CLIENT_SECRET,
    },

    google: {
      clientId: env.BT_GOOGLE_CLIENT_ID,
      clientSecret: env.BT_GOOGLE_CLIENT_SECRET,
    },

    discord: {
      clientId: env.BT_DISCORD_CLIENT_ID,
      clientSecret: env.BT_DISCORD_CLIENT_SECRET,
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
      secureCookie: env.BT_SESSION_SECURE_COOKIE,
    },

    stripe: {
      sdkKey: env.BT_STRIPE_SDK_KEY,
      webhookSigningSecret: env.BT_STRIPE_WEBHOOK_SECRET,
    },

    adminEmail: env.BT_ADMIN_EMAIL,
    baseUrl: env.BT_BASE_URL,
    configCatSdkKey: env.BT_CONFIGCAT_SDK_KEY,
    friendsLimit: env.BT_FRIENDS_LIMIT,
    isProduction: env.NODE_ENV === 'production',
    env: env.NODE_ENV,
    ipGeolocationApiKey: env.BT_IPGEOLOCATION_API_KEY,
    logLevel: env.BT_LOG_LEVEL,
    passwordSaltRounds: env.BT_PASSWORD_SALT_ROUNDS,
    port: env.BT_PORT,
    postgresRequireSsl: env.BT_POSTGRES_REQUIRE_SSL,
    postgresUri: env.BT_POSTGRES_URI,
    redisUri: env.BT_REDIS_URI,
  }));

export const Config = ConfigSchema.parse(process.env);
