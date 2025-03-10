import { RouteRecordRaw } from 'vue-router';

export const LogbookRouteNames = {
  ImportLogs: 'import-logs',
  NamedLogs: 'named-logs',
  NewLogEntry: 'new-log-entry',
  LogEntry: 'log-entry',
  SignLogEntry: 'sign-log-entry',
};

export const LogbookRoutes: RouteRecordRaw[] = [
  {
    path: '/importLogs/:username',
    name: LogbookRouteNames.ImportLogs,
    component: () => import('../views/logbook/import-logs-view.vue'),
  },
  {
    path: '/logbook/:username',
    name: LogbookRouteNames.NamedLogs,
    component: () => import('../views/logbook/logbook-view.vue'),
  },
  {
    path: '/logbook/:username/new',
    name: LogbookRouteNames.NewLogEntry,
    component: () => import('../views/logbook/log-entry-view.vue'),
  },
  {
    path: '/logbook/:username/:entryId',
    name: LogbookRouteNames.LogEntry,
    component: () => import('../views/logbook/log-entry-view.vue'),
  },
  {
    path: '/logbook/:username/:entryId/sign',
    name: LogbookRouteNames.SignLogEntry,
    component: () => import('../views/logbook/sign-log-entry-view.vue'),
  },
];
