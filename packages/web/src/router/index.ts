import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';

import { AdminRouteNames, AdminRoutes } from './admin.routes';
import { DiveSiteRouteNames, DiveSiteRoutes } from './dive-site.routes';
import { LogbookRouteNames, LogbookRoutes } from './logbook.routes';
import { OperatorRouteNames, OperatorsRoutes } from './operators.routes';
import { StaticRouteNames, StaticRoutes } from './static.routes';
import { UserRouteNames, UserRoutes } from './users.routes';

const routes: RouteRecordRaw[] = [
  ...AdminRoutes,
  ...UserRoutes,
  ...OperatorsRoutes,
  ...DiveSiteRoutes,
  ...LogbookRoutes,
  ...StaticRoutes,

  // Universal "not found" route to catch anything that doesn't match the pre-defined routees.
  // IMPORTANT: This must be the last element in the array!!
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/not-found-view.vue'),
  },
];

const history = createWebHistory();

export const Routes = {
  admin: AdminRouteNames,
  sites: DiveSiteRouteNames,
  logbook: LogbookRouteNames,
  operators: OperatorRouteNames,
  static: StaticRouteNames,
  users: UserRouteNames,
} as const;

export const router = createRouter({
  history,
  routes,
});
