import { createPinia } from 'pinia';
import { App, createSSRApp } from 'vue';
import { Router } from 'vue-router';
import AppComponent from './app.vue';
import { ApiClient, ApiClientKey } from './client';
import { Config } from './config';
import { router } from './router';

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export function createApp(): {
  app: App;
  router: Router;
} {
  // API Client
  const client = new ApiClient(Config.apiUrl);

  // Pinia (state store)
  const pinia = createPinia();

  // Initialize the application
  const app = createSSRApp(AppComponent)
    .use(router)
    .use(pinia)
    .provide(ApiClientKey, client);

  return { app, router };
}
