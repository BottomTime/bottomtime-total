import { createApp } from 'vue';
import request from 'superagent';

import App from './App.vue';
import { DefaultUserManager } from './users/default-user-manager';
import router from './router';
import store from './store';
import { UserManagerKey, WithErrorHandlingKey } from './injection-keys';
import { createErrorHandler } from './helpers/create-error-handler';

const agent = request.agent();
const userManager = new DefaultUserManager(agent);
const withErrorHandling = createErrorHandler(store);

createApp(App)
  .provide(UserManagerKey, userManager)
  .provide(WithErrorHandlingKey, withErrorHandling)
  .use(store)
  .use(router)
  .mount('#app');
