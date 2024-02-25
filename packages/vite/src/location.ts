import { URL } from 'url';
import { InjectionKey, inject } from 'vue';

export class MockLocation implements Location {
  readonly ancestorOrigins = {} as DOMStringList;
  private location: URL;

  constructor(url?: URL | string) {
    if (url) {
      this.location = typeof url === 'string' ? new URL(url) : url;
    } else {
      this.location = new URL('http://localhost/');
    }
  }

  get hash(): string {
    return this.location.hash;
  }

  get host(): string {
    return this.location.host;
  }

  get hostname(): string {
    return this.location.hostname;
  }

  get href(): string {
    return this.href;
  }

  toString(): string {
    return this.location.toString();
  }

  get origin(): string {
    return this.location.origin;
  }

  get pathname(): string {
    return this.location.pathname;
  }

  get port(): string {
    return this.location.port;
  }

  get protocol(): string {
    return this.location.protocol;
  }

  get search(): string {
    return this.location.search;
  }

  assign(url: string | URL): void {
    this.location = typeof url === 'string' ? new URL(url) : url;
  }

  reload(): void {
    /* No-op */
  }

  replace(url: string | URL): void {
    this.location = typeof url === 'string' ? new URL(url) : url;
  }
}

export const LocationKey: InjectionKey<Location> = Symbol('Location');

export function useLocation(): Location {
  const location = inject(LocationKey);

  if (!location) {
    throw new Error(
      'Location has not been initialized. Did you forget to call `app.provide(LocationKey, window.location)`?',
    );
  }

  return location;
}
