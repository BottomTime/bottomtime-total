import 'dotenv/config';

function toNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export class Config {
  static get appTitle(): string {
    return process.env.BTWEB_APP_TITLE ?? 'Bottom Time';
  }

  static get apiUrl(): string {
    return process.env.BTWEB_API_URL ?? 'http://localhost:4800/';
  }

  static get baseUrl(): string {
    return process.env.BTWEB_BASE_URL ?? 'http://localhost:4850/';
  }

  static get cookieName(): string {
    return process.env.BTWEB_COOKIE_NAME ?? 'bottomtime.local';
  }

  static get env(): string {
    return process.env.NODE_ENV ?? 'development';
  }

  static get logLevel(): string {
    return process.env.BTWEB_LOG_LEVEL ?? 'debug';
  }

  static get isProduction(): boolean {
    return this.env === 'production';
  }

  static get port(): number {
    return toNumber(process.env.BTWEB_PORT, 4850);
  }
}
