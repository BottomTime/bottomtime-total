import { RouteRecordRaw } from 'vue-router';

export const StaticRoutes: RouteRecordRaw[] = [
  {
    path: '/cookies',
    name: 'cookies',
    component: () => import('../views/cookies-view.vue'),
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../views/home-view.vue'),
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('../views/privacy-view.vue'),
  },
  {
    path: '/serverError',
    name: 'server-error',
    component: () => import('../views/server-error-view.vue'),
  },
  {
    path: '/termsOfService',
    name: 'terms-of-service',
    component: () => import('../views/terms-of-service-view.vue'),
  },
];
