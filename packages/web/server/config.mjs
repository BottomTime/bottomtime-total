/* eslint-disable no-process-env */
import 'dotenv/config';

function toNumber(value, defaultValue) {
  if (!value) return defaultValue;
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export class Config {
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
