import { createPinia } from 'pinia';
import { App, createSSRApp } from 'vue';
import { Router } from 'vue-router';
import AppComponent from './app-root.vue';
import { ApiClient, ApiClientKey } from './client';
import { Config } from './config';
import { router } from './router';

export function createApp(): {
  app: App;
  router: Router;
} {
  // API Client
  const client = new ApiClient({
    baseUrl: Config.apiUrl,
  });

  // Pinia (state store)
  const pinia = createPinia();

  // Initialize the application
  const app = createSSRApp(AppComponent)
    .use(router)
    .use(pinia)
    .provide(ApiClientKey, client);

  return { app, router };
}
