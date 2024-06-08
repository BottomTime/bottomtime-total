import { RouteRecordRaw } from 'vue-router';

export const AdminRoutes: RouteRecordRaw[] = [
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
    path: '/admin/tanks',
    name: 'admin-tanks',
    component: () => import('../views/admin-tanks-view.vue'),
  },
  {
    path: '/admin/tanks/new',
    name: 'admin-new-tank',
    component: () => import('../views/admin-new-tank-view.vue'),
  },
  {
    path: '/admin/tanks/:tankId',
    name: 'admin-tank',
    component: () => import('../views/admin-tank-view.vue'),
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
];
