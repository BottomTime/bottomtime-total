import { createApp } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import request from 'superagent';

import App from './App.vue';
import { createErrorHandler } from './helpers';
import { createStore } from './store';
import { DefaultDiveSiteManager } from './diveSites';
import { DefaultUserManager } from './users/default-user-manager';
import {
  DiveSiteManagerKey,
  StoreKey,
  UserManagerKey,
  WithErrorHandlingKey,
} from './injection-keys';
import router from './router';

dayjs.extend(relativeTime);

const agent = request.agent();
const diveSiteManager = new DefaultDiveSiteManager(agent);
const userManager = new DefaultUserManager(agent);
const store = createStore();
const withErrorHandling = createErrorHandler(store);

createApp(App)
  .provide(DiveSiteManagerKey, diveSiteManager)
  .provide(UserManagerKey, userManager)
  .provide(WithErrorHandlingKey, withErrorHandling)
  .use(store, StoreKey)
  .use(router)
  .mount('#app');
