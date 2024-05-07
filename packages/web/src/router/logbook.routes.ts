import { RouteRecordRaw } from 'vue-router';

export const LogbookRoutes: RouteRecordRaw[] = [
  {
    path: '/importLogs/:username',
    name: 'import-logs',
    component: () => import('../views/import-logs-view.vue'),
  },
  {
    path: '/logbook/:username',
    name: 'named-logs',
    component: () => import('../views/logbook-view.vue'),
  },
  {
    path: '/logbook/:username/new',
    name: 'new-log-entry',
    component: () => import('../views/new-log-entry-view.vue'),
  },
  {
    path: '/logbook/:username/:entryId',
    name: 'log-entry',
    component: () => import('../views/log-entry-view.vue'),
  },
];
