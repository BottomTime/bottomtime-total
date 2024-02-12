export class Config {
  /** Email address for contacting support/admin. */
  static get adminEmail(): string {
    return process.env.BTWEB_VITE_ADMIN_EMAIL || 'admin@bottomti.me';
  }

  /** Base URL at which the app is listening for requests. */
  static get baseUrl(): string {
    return process.env.BTWEB_VITE_BASE_URL || 'http://localhost:4850/';
  }

  /** The value of the `NODE_ENV` environment variable. */
  static get env(): string {
    return process.env.NODE_ENV || 'development';
  }

  /**
   * Vite mode. (`development` or `production`). This differs from `NODE_ENV`.
   * See documentation here https://vitejs.dev/guide/env-and-mode.html#node-env-and-modes
   */
  static get mode(): string {
    return process.env.MODE || 'development';
  }

  static get isProduction(): boolean {
    return Config.env === 'production';
  }

  /**
   * Detects server-side rendering.
   * Will be true if we are currently executing on the server-side or false if we are running in the browser.
   */
  static get isSSR(): boolean {
    return typeof window === 'undefined';
  }
}
