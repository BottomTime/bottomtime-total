import { RouteRecordRaw } from 'vue-router';

export const DiveOperatorsRoutes: RouteRecordRaw[] = [
  {
    path: '/shops/:username',
    name: 'dive-operators',
    component: () => import('../views/dive-operators-view.vue'),
  },
];
