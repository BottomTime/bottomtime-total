import { ApiClient } from '@bottomtime/api';

import '@stripe/stripe-js';

import { IConfigCatClient, PollingMode } from 'configcat-common';
import { getClient } from 'configcat-js-ssr';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import { ApiClientKey } from './api-client';
import AppComponent from './app-root.vue';
import { clickOutside } from './click-outside';
import { Config } from './config';
import { FeaturesServiceKey } from './featrues';
import { router } from './router';
import { StripeLoader, StripeLoaderKey } from './stripe';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(tz);
dayjs.extend(utc);

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
  .provide(StripeLoaderKey, StripeLoader);

app.mount('#app');
