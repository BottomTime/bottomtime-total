import { App, createSSRApp } from 'vue';
import { Router } from 'vue-router';
import AppComponent from './app.vue';
import { ApiClient, ApiClientKey } from './client';
import { Config } from './config';
import { router } from './router';
import { createStore, BTStoreKey } from './store';

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export function createApp(): {
  app: App;
  router: Router;
} {
  const client = new ApiClient(Config.apiUrl);
  const store = createStore();

  const app = createSSRApp(AppComponent)
    .use(router)
    .use(store, BTStoreKey)
    .provide(ApiClientKey, client);

  return { app, router };
}
