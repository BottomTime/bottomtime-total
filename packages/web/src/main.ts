import { ApiClient, ApiClientOptions } from '@bottomtime/api';

import { IConfigCatClient, PollingMode } from 'configcat-common';
import { getClient } from 'configcat-js-ssr';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Pinia, StateTree, createPinia } from 'pinia';
import { App, createSSRApp } from 'vue';
import { Router } from 'vue-router';

import { ApiClientKey } from './api-client';
import AppComponent from './app-root.vue';
import { clickOutside } from './click-outside';
import { Config } from './config';
import { FeaturesServiceKey } from './featrues';
import { LocationKey, MockLocation } from './location';
import { router } from './router';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(tz);
dayjs.extend(utc);

export function createApp(
  clientOptions?: ApiClientOptions,
  initialState?: Record<string, StateTree>,
): {
  app: App;
  router: Router;
  store: Pinia;
} {
  // API Client
  const client = new ApiClient(clientOptions);

  // Pinia (state store)
  const pinia = createPinia();

  if (!Config.isSSR && window.__INITIAL_STATE__) {
    // On the client-side the initial state will be serialized as window.__INITIAL_STATE__
    pinia.state.value = window.__INITIAL_STATE__;
  } else if (initialState) {
    // On the server-side we use the initial state to hydrate the store
    pinia.state.value = initialState;
  }

  const configCat: IConfigCatClient = getClient(
    Config.configCatSdkKey,
    PollingMode.AutoPoll,
  );

  // Initialize the application
  const app = createSSRApp(AppComponent)
    .directive('click-outside', clickOutside)
    .use(router)
    .use(pinia)
    .provide(ApiClientKey, client)
    .provide(FeaturesServiceKey, configCat)
    .provide(
      LocationKey,
      typeof window === 'undefined' ? new MockLocation() : window.location,
    );

  return { app, router, store: pinia };
}
