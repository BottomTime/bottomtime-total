import { RouteRecordRaw } from 'vue-router';

export const StaticRouteNames = {
  Cookies: 'cookies',
  Developers: 'developers',
  Home: 'home',
  Privacy: 'privacy',
  ServerError: 'server-error',
  TermsOfService: 'terms-of-service',
} as const;

export const StaticRoutes: RouteRecordRaw[] = [
  {
    path: '/cookies',
    name: StaticRouteNames.Cookies,
    component: () => import('../views/cookies-view.vue'),
  },
  {
    path: '/developers',
    name: StaticRouteNames.Developers,
    component: () => import('../views/developers-view.vue'),
  },
  {
    path: '/',
    name: StaticRouteNames.Home,
    component: () => import('../views/home-view.vue'),
  },
  {
    path: '/privacy',
    name: StaticRouteNames.Privacy,
    component: () => import('../views/privacy-view.vue'),
  },
  {
    path: '/serverError',
    name: StaticRouteNames.ServerError,
    component: () => import('../views/server-error-view.vue'),
  },
  {
    path: '/termsOfService',
    name: StaticRouteNames.TermsOfService,
    component: () => import('../views/terms-of-service-view.vue'),
  },
];
