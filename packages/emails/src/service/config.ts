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
  mail: {
    host: string;
    port: number;
    username: string;
    password: string;
    replyTo: string;
    from: string;
  };

  adminEmail: string;
  baseUrl: string;
  isProduction: boolean;
  env: string;
  logLevel: LogLevel;
}

const ConfigSchema = z
  .object({
    // SMTP
    BT_SMTP_HOST: z.string().default('email-smtp.us-east-1.amazonaws.com'),
    BT_SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(465),
    BT_SMTP_USERNAME: z.string().min(1),
    BT_SMTP_PASSWORD: z.string().min(1),
    BT_SMTP_REPLY_TO: z.string().default('donotreply@bottomti.me'),
    BT_SMTP_FROM: z.string().default('"Bottom Time Admin" <admin@bottomti.me>'),

    // Misc.
    BT_ADMIN_EMAIL: z.string().default('admin@bottomti.me'),
    BT_BASE_URL: z.string().url().default('http://localhost:4850'),
    BT_LOG_LEVEL: LogLevelSchema.default('debug'),
    NODE_ENV: z.string().default('local'),
  })
  .transform<AppConfig>((env) => ({
    mail: {
      host: env.BT_SMTP_HOST,
      port: env.BT_SMTP_PORT,
      username: env.BT_SMTP_USERNAME,
      password: env.BT_SMTP_PASSWORD,
      replyTo: env.BT_SMTP_REPLY_TO,
      from: env.BT_SMTP_FROM,
    },

    adminEmail: env.BT_ADMIN_EMAIL,
    baseUrl: env.BT_BASE_URL,
    isProduction: env.NODE_ENV === 'production',
    env: env.NODE_ENV,
    logLevel: env.BT_LOG_LEVEL,
  }));

export const Config = ConfigSchema.parse(process.env);
