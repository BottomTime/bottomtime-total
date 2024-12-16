import { defineComponent } from 'vue';
import { RouteRecordRaw } from 'vue-router';
import {
  Router,
  createMemoryHistory,
  createRouter as vueCreateRouter,
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
      {
        path: '/:pathMatch(.*)*',
        component: defineComponent({
          template: '<div>404 Not Found</div>',
        }),
      },
    ],
  });
  return router;
}
