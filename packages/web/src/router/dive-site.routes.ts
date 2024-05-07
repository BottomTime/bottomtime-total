import { RouteRecordRaw } from 'vue-router';

export const DiveSiteRoutes: RouteRecordRaw[] = [
  {
    path: '/diveSites',
    name: 'dive-sites',
    component: () => import('../views/dive-sites-view.vue'),
  },
  {
    path: '/diveSites/new',
    name: 'new-dive-site',
    component: () => import('../views/new-dive-site-view.vue'),
  },
  {
    path: '/diveSites/:siteId',
    name: 'dive-site',
    component: () => import('../views/dive-site-view.vue'),
  },
];
