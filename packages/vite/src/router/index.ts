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
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('../views/admin-dashboard-view.vue'),
  },
  {
    path: '/admin/users/:username',
    name: 'admin-user',
    component: () => import('../views/admin-user-view.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
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
    path: '/settings',
    name: 'settings',
    component: () => import('../views/settings-view.vue'),
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
