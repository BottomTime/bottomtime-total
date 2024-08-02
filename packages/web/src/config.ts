/* eslint-disable no-process-env */
import { BooleanString } from '@bottomtime/api';

export class Config {
  /** Email address for contacting support/admin. */
  static get adminEmail(): string {
    return process.env.BTWEB_VITE_ADMIN_EMAIL || 'admin@bottomti.me';
  }

  /** The application title as it should appear in the browser tab, etc. */
  static get appTitle(): string {
    return process.env.BTWEB_VITE_APP_TITLE || 'Bottom Time';
  }

  /** Base URL at which the app is listening for requests. */
  static get baseUrl(): string {
    return process.env.BTWEB_VITE_BASE_URL || 'http://localhost:4850/';
  }

  /**
   * API SDK key for accessing ConfigCat feature flag values.
   * (Feature flags can be managed at https://app.configcat.com/)
   */
  static get configCatSdkKey(): string {
    return process.env.BTWEB_VITE_CONFIGCAT_API_KEY || '';
  }

  /** Whether or not to invoke Google's Places APIs. (This needs to be set to true to enable autocomplete in location boxes.) */
  static get enablePlacesApi(): boolean {
    const parsed = BooleanString.safeParse(
      process.env.BTWEB_VITE_ENABLE_PLACES_API,
    );
    return parsed.success ? parsed.data : false;
  }

  /** The value of the `NODE_ENV` environment variable. */
  static get env(): string {
    return process.env.NODE_ENV || 'development';
  }

  /** Google API key for accessing the Google Maps API. */
  static get googleApiKey(): string {
    return process.env.BTWEB_VITE_GOOGLE_API_KEY || '';
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
