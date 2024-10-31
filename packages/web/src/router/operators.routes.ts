import { RouteRecordRaw } from 'vue-router';

export const OperatorRouteNames = {
  DiveOperators: 'dive-operators',
  CreateDiveOperator: 'create-dive-operator',
  DiveOperator: 'dive-operator',
} as const;

export const OperatorsRoutes: RouteRecordRaw[] = [
  {
    path: '/shops',
    name: OperatorRouteNames.DiveOperators,
    component: () => import('../views/operators/operators-view.vue'),
  },
  {
    path: '/shops/createNew',
    name: OperatorRouteNames.CreateDiveOperator,
    component: () => import('../views/operators/operator-view.vue'),
  },
  {
    path: '/shops/:shopKey',
    name: OperatorRouteNames.DiveOperator,
    component: () => import('../views/operators/operator-view.vue'),
  },
];
