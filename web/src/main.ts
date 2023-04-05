import { createApp } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import request from 'superagent';

import App from './App.vue';
import { DefaultUserManager } from './users/default-user-manager';
import router from './router';
import { createStore } from './store';
import {
  StoreKey,
  UserManagerKey,
  WithErrorHandlingKey,
} from './injection-keys';
import { createErrorHandler } from './helpers';

dayjs.extend(relativeTime);

const agent = request.agent();
const userManager = new DefaultUserManager(agent);
const store = createStore();
const withErrorHandling = createErrorHandler(store);

createApp(App)
  .provide(UserManagerKey, userManager)
  .provide(WithErrorHandlingKey, withErrorHandling)
  .use(store, StoreKey)
  .use(router)
  .mount('#app');
