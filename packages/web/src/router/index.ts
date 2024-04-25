import {
  RouteRecordRaw,
  createMemoryHistory,
  createRouter,
  createWebHistory,
} from 'vue-router';

import { Config } from '../config';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/home-view.vue'),
  },
  {
    path: '/account',
    name: 'account',
    component: () => import('../views/account-view.vue'),
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: () => import('../views/admin-dashboard-view.vue'),
  },
  {
    path: '/admin/alerts',
    name: 'admin-alerts',
    component: () => import('../views/admin-alerts-view.vue'),
  },
  {
    path: '/admin/alerts/new',
    name: 'new-alert',
    component: () => import('../views/admin-alert-view.vue'),
  },
  {
    path: '/admin/alerts/:alertId',
    name: 'edit-alert',
    component: () => import('../views/admin-alert-view.vue'),
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('../views/admin-users-view.vue'),
  },
  {
    path: '/admin/users/:username',
    name: 'admin-user',
    component: () => import('../views/admin-user-view.vue'),
  },
  {
    path: '/cookies',
    name: 'cookies',
    component: () => import('../views/cookies-view.vue'),
  },
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
  {
    path: '/friends',
    name: 'friends',
    component: () => import('../views/friends-view.vue'),
  },
  {
    path: '/friendRequests',
    name: 'friend-requests',
    component: () => import('../views/friend-requests-view.vue'),
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('../views/privacy-view.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/profile-view.vue'),
  },
  {
    path: '/profile/:username',
    name: 'named-profile',
    component: () => import('../views/profile-view.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/register-view.vue'),
  },
  {
    path: '/resetPassword',
    name: 'reset-password',
    component: () => import('../views/reset-password-view.vue'),
  },
  {
    path: '/serverError',
    name: 'server-error',
    component: () => import('../views/server-error-view.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/settings-view.vue'),
  },
  {
    path: '/termsOfService',
    name: 'terms-of-service',
    component: () => import('../views/terms-of-service-view.vue'),
  },
  {
    path: '/welcome',
    name: 'welcome',
    component: () => import('../views/welcome-view.vue'),
  },
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
