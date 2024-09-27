/* eslint-disable no-process-env */
import 'dotenv/config';

function toBoolean(value, defaultValue) {
  if (typeof value !== 'string') return defaultValue;
  return /(true|1)/i.test(value);
}

function toNumber(value, defaultValue) {
  if (!value) return defaultValue;
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export class Config {
  static get edgeAuth() {
    return {
      enabled: toBoolean(process.env.BT_EDGEAUTH_ENABLED, false),
      audience: process.env.BT_EDGEAUTH_AUDIENCE || '',
      cookieName: process.env.BT_EDGEAUTH_COOKIE_NAME || '',
      secret: process.env.BT_EDGEAUTH_SESSION_SECRET || '',
    };
  }

  static get appTitle() {
    return process.env.BTWEB_VITE_APP_TITLE ?? 'Bottom Time';
  }

  static get apiUrl() {
    return process.env.BTWEB_API_URL ?? 'http://localhost:4800/';
  }

  static get baseUrl() {
    return process.env.BTWEB_VITE_BASE_URL ?? 'http://localhost:4850/';
  }

  static get configCatSdkKey() {
    return process.env.BTWEB_VITE_CONFIGCAT_API_KEY || '';
  }

  static get cookieName() {
    return process.env.BTWEB_COOKIE_NAME ?? 'bottomtime.local';
  }

  static get env() {
    return process.env.NODE_ENV ?? 'development';
  }

  static get isProduction() {
    return this.env === 'production';
  }

  static get logLevel() {
    return process.env.BTWEB_LOG_LEVEL ?? 'info';
  }

  static get port() {
    return toNumber(process.env.BTWEB_PORT, 4850);
  }
}

export function getEnv() {
  const env = Object.entries(process.env)
    .filter(([key]) => key.startsWith('BTWEB_VITE_') || key === 'NODE_ENV')
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  Object.assign(env, import.meta.env);
  return env;
}
