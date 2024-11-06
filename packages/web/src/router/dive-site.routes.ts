import { RouteRecordRaw } from 'vue-router';

export const DiveSiteRouteNames = {
  DiveSites: 'dive-sites',
  NewDiveSite: 'new-dive-site',
  DiveSite: 'dive-site',
} as const;

export const DiveSiteRoutes: RouteRecordRaw[] = [
  {
    path: '/diveSites',
    name: DiveSiteRouteNames.DiveSites,
    component: () => import('../views/sites/dive-sites-view.vue'),
  },
  {
    path: '/diveSites/new',
    name: DiveSiteRouteNames.NewDiveSite,
    component: () => import('../views/sites/dive-site-view.vue'),
  },
  {
    path: '/diveSites/:siteId',
    name: DiveSiteRouteNames.DiveSite,
    component: () => import('../views/sites/dive-site-view.vue'),
  },
];
