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
  awsRegion: string;
  baseUrl: string;
  cognito: {
    clientId: string;
    clientSecret: string;
    domain: string;
  };
  cookieName: string;
  isProduction: boolean;
  env: string;
  logLevel: LogLevel;
  sessionSecret: string;
}

const ConfigSchema = z
  .object({
    AWS_REGION: z.string().default('us-east-1'),
    BT_EDGE_BASE_URL: z.string().default('http://localhost:9000'),
    BT_EDGE_CLIENT_ID: z.string().default(''),
    BT_EDGE_CLIENT_SECRET: z.string().default(''),
    BT_EDGE_COGNITO_DOMAIN: z.string().default(''),
    BT_EDGE_COOKIE_NAME: z.string().default('bottomtime.auth'),
    BT_EDGE_SESSION_SECRET: z
      .string()
      .default(
        'nxS0JJ04kNjiZpJxQz5iq6OFoN6bAvsQxO2eVLGaSQyslZU8ltxqYlmKUIon9B8scg89VBg3eFZAs6umkWUYWQ',
      ),
    BT_LOG_LEVEL: LogLevelSchema.default('debug'),
    NODE_ENV: z.string().default('local'),
  })
  .transform<AppConfig>((env) => ({
    awsRegion: env.AWS_REGION,
    baseUrl: env.BT_EDGE_BASE_URL,
    cognito: {
      domain: env.BT_EDGE_COGNITO_DOMAIN,
      clientId: env.BT_EDGE_CLIENT_ID,
      clientSecret: env.BT_EDGE_CLIENT_SECRET,
    },
    cookieName: env.BT_EDGE_COOKIE_NAME,
    isProduction: env.NODE_ENV === 'production',
    env: env.NODE_ENV,
    logLevel: env.BT_LOG_LEVEL,
    sessionSecret: env.BT_EDGE_SESSION_SECRET,
  }));

export const Config = ConfigSchema.parse(process.env);
