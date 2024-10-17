import { RouteRecordRaw } from 'vue-router';

export const DiveOperatorsRoutes: RouteRecordRaw[] = [
  {
    path: '/shops/createNew',
    name: 'create-dive-operator',
    component: () => import('../views/dive-operator-view.vue'),
  },
  {
    path: '/shops',
    name: 'dive-operators',
    component: () => import('../views/dive-operators-view.vue'),
  },
  {
    path: '/shops/:shopKey',
    name: 'dive-operator',
    component: () => import('../views/dive-operator-view.vue'),
  },
];
