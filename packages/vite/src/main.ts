import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { createPinia } from 'pinia';
import { App, createSSRApp } from 'vue';
import { Router } from 'vue-router';

import AppComponent from './app-root.vue';
import { clickOutside } from './click-outside';
import { ApiClient, ApiClientKey } from './client';
import { router } from './router';

dayjs.extend(relativeTime);

export function createApp(): {
  app: App;
  router: Router;
} {
  // API Client
  const client = new ApiClient();

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
