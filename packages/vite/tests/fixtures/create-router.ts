import { defineComponent } from 'vue';
import { RouteRecordRaw } from 'vue-router';
import {
  createRouter as vueCreateRouter,
  Router,
  createMemoryHistory,
} from 'vue-router';

export function createRouter(routes?: RouteRecordRaw[]): Router {
  const router = vueCreateRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: defineComponent({
          template: '<div>Mock Component</div>',
        }),
      },
      ...(routes ?? []),
    ],
  });
  return router;
}
