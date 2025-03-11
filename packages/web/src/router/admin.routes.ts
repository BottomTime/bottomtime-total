import { RouteRecordRaw } from 'vue-router';

export const AdminRouteNames = {
  AdminAgencies: 'admin-agencies',
  AdminDashboard: 'admin-dashboard',
  AdminAlerts: 'admin-alerts',
  NewAlert: 'new-alert',
  EditAlert: 'edit-alert',
  AdminTanks: 'admin-tanks',
  AdminNewTank: 'admin-new-tank',
  AdminTank: 'admin-tank',
  AdminUsers: 'admin-users',
  AdminUser: 'admin-user',
} as const;

export const AdminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: AdminRouteNames.AdminDashboard,
    component: () => import('../views/admin/dashboard-view.vue'),
  },
  {
    path: '/admin/agencies',
    name: AdminRouteNames.AdminAgencies,
    component: () => import('../views/admin/agencies-view.vue'),
  },
  {
    path: '/admin/alerts',
    name: AdminRouteNames.AdminAlerts,
    component: () => import('../views/admin/alerts-view.vue'),
  },
  {
    path: '/admin/alerts/new',
    name: AdminRouteNames.NewAlert,
    component: () => import('../views/admin/alert-view.vue'),
  },
  {
    path: '/admin/alerts/:alertId',
    name: AdminRouteNames.EditAlert,
    component: () => import('../views/admin/alert-view.vue'),
  },
  {
    path: '/admin/tanks',
    name: AdminRouteNames.AdminTanks,
    component: () => import('../views/admin/tanks-view.vue'),
  },
  {
    path: '/admin/tanks/new',
    name: AdminRouteNames.AdminNewTank,
    component: () => import('../views/admin/tank-view.vue'),
  },
  {
    path: '/admin/tanks/:tankId',
    name: AdminRouteNames.AdminTank,
    component: () => import('../views/admin/tank-view.vue'),
  },
  {
    path: '/admin/users',
    name: AdminRouteNames.AdminUsers,
    component: () => import('../views/admin/users-view.vue'),
  },
  {
    path: '/admin/users/:username',
    name: AdminRouteNames.AdminUser,
    component: () => import('../views/admin/user-view.vue'),
  },
];
