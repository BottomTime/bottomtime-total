import { ApiClient } from '@bottomtime/api';

import '@stripe/stripe-js';

import { IConfigCatClient, PollingMode } from 'configcat-common';
import { getClient } from 'configcat-js-ssr';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import { ApiClientKey } from './api-client';
import AppComponent from './app-root.vue';
import { clickOutside } from './click-outside';
import { Config } from './config';
import { FeaturesServiceKey } from './featrues';
import { Geolocation, GeolocationKey } from './geolocation';
import {
  NavigationObserver,
  NavigationObserverKey,
} from './navigation-observer';
import { router } from './router';
import { StripeLoader, StripeLoaderKey } from './stripe';

// API Client
const client = new ApiClient();

// Pinia (state store)
const pinia = createPinia();

// ConfigCat client for feature flags
const configCat: IConfigCatClient = getClient(
  Config.configCatSdkKey,
  PollingMode.AutoPoll,
);

// Initialize the application
const app = createApp(AppComponent)
  .directive('click-outside', clickOutside)
  .use(router)
  .use(pinia)
  .provide(ApiClientKey, client)
  .provide(FeaturesServiceKey, configCat)
  .provide(GeolocationKey, new Geolocation())
  .provide(NavigationObserverKey, new NavigationObserver(router))
  .provide(StripeLoaderKey, StripeLoader);

app.mount('#app');
