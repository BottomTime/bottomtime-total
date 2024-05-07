import {
  RouteRecordRaw,
  createMemoryHistory,
  createRouter,
  createWebHistory,
} from 'vue-router';

import { Config } from '../config';
import { AdminRoutes } from './admin.routes';
import { DiveSiteRoutes } from './dive-site.routes';
import { StaticRoutes } from './static.routes';
import { UserRoutes } from './user.routes';

const routes: RouteRecordRaw[] = [
  ...AdminRoutes,
  ...UserRoutes,
  ...DiveSiteRoutes,
  ...StaticRoutes,

  // Universal "not found" route to catch anything that doesn't match the pre-defined routees.
  // IMPORTANT: This must be the last element in the array!!
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/not-found-view.vue'),
  },
];

const history = Config.isSSR ? createMemoryHistory() : createWebHistory();

export const router = createRouter({
  history,
  routes,
});
