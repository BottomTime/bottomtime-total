import { RouteRecordRaw } from 'vue-router';

export const DiveOperatorsRoutes: RouteRecordRaw[] = [
  {
    path: '/shops',
    name: 'dive-operators',
    component: () => import('../views/dive-operators-view.vue'),
  },
  {
    path: '/shops/:username',
    name: 'user-dive-operators',
    component: () => import('../views/dive-operators-view.vue'),
  },
];
