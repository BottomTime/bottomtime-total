import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { createPinia } from 'pinia';
import { App, createSSRApp } from 'vue';
import { Router } from 'vue-router';

import AppComponent from './app-root.vue';
import { clickOutside } from './click-outside';
import { ApiClient, ApiClientKey, ApiClientOptions } from './client';
import { router } from './router';

dayjs.extend(relativeTime);
dayjs.extend(utc);

export function createApp(clientOptions?: ApiClientOptions): {
  app: App;
  router: Router;
} {
  // API Client
  const client = new ApiClient(clientOptions);

  // Pinia (state store)
  const pinia = createPinia();

  // Initialize the application
  const app = createSSRApp(AppComponent)
    .directive('click-outside', clickOutside)
    .use(router)
    .use(pinia)
    .provide(ApiClientKey, client);

  return { app, router };
}
