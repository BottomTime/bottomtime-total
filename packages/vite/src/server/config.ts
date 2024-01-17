import 'dotenv/config';

function toNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export class Config {
  static get baseUrl(): string {
    return process.env.BT_BASE_URL ?? 'http://localhost:8080/';
  }

  static get env(): string {
    return process.env.NODE_ENV ?? 'development';
  }

  static get logLevel(): string {
    return process.env.BT_LOG_LEVEL ?? 'info';
  }

  static get isProduction(): boolean {
    return this.env === 'production';
  }

  static get port(): number {
    return toNumber(process.env.BT_PORT, 4850);
  }
}
