import { inject, InjectionKey } from 'vue';
import { ApiClient } from './client';

export * from './client';

export const ApiClientKey: InjectionKey<ApiClient> = Symbol('ApiClient');
export function useClient(): ApiClient {
  const client = inject(ApiClientKey);

  if (!client) {
    throw new Error(
      'Api Client has not been initialized. Did you forget to call `app.provide(key, client)`?',
    );
  }

  return client;
}
