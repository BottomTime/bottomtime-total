import { createApp } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import request from 'superagent';

import App from './App.vue';
import router from './router';
import { createStore } from './store';
import { ApiClientKey, StoreKey, WithErrorHandlingKey } from './injection-keys';
import { createErrorHandler } from './helpers';
import { SuperAgentClient } from './client/superagent-client';

dayjs.extend(relativeTime);

const agent = request.agent();
const apiClient = new SuperAgentClient(agent);
const store = createStore();
const withErrorHandling = createErrorHandler(store);

createApp(App)
  .provide(ApiClientKey, apiClient)
  .provide(WithErrorHandlingKey, withErrorHandling)
  .use(store, StoreKey)
  .use(router)
  .mount('#app');
