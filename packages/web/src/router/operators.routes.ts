import { RouteRecordRaw } from 'vue-router';

export const OperatorsRoutes: RouteRecordRaw[] = [
  {
    path: '/shops',
    name: 'dive-operators',
    component: () => import('../views/operators-view.vue'),
  },
  {
    path: '/shops/createNew',
    name: 'create-dive-operator',
    component: () => import('../views/operator-view.vue'),
  },
  {
    path: '/shops/:shopKey',
    name: 'dive-operator',
    component: () => import('../views/operator-view.vue'),
  },
];
