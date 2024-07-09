/* eslint-disable vue/one-component-per-file */
import { HttpException } from '@bottomtime/api';

import { mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { defineComponent, onMounted } from 'vue';
import { Router, createMemoryHistory, createRouter } from 'vue-router';

import {
  ErrorHandlers,
  ForbiddenErrorToast,
  ServerErrorToast,
  useOops,
} from '../../src/oops';
import { useCurrentUser, useToasts } from '../../src/store';
import { BasicUser } from '../fixtures/users';

let pinia: Pinia;
let router: Router;

function getErrorResponse(status: number, method = 'GET'): HttpException {
  return new HttpException(status, '', 'Nope!', {
    status,
    message: 'Nope!',
    method,
    path: '/nope',
  });
}

function testOops(
  fn: () => string | Promise<string>,
  handlers?: Partial<ErrorHandlers>,
): Promise<string | null> {
  return new Promise((resolve) => {
    const testComponent = defineComponent({
      setup() {
        const oops = useOops();

        onMounted(async () => {
          const result = await oops<string>(fn, handlers);
          resolve(result);
        });
      },
      template: '<div></div>',
    });

    mount(testComponent, {
      global: {
        plugins: [pinia, router],
      },
    });
  });
}

describe('"Oops" error handler', () => {
  beforeEach(() => {
    pinia = createPinia();
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/:pathMatch(.*)*',
          name: 'test',
          component: defineComponent({}),
        },
      ],
    });
  });

  it('will return the value of the function if it succeeds', async () => {
    const expected = 'success!';
    const actual = await testOops(() => expected);
    expect(actual).toBe(expected);
  });

  it('will resolve to the value of the function if it returns a promise', async () => {
    const expected = 'success!';
    const actual = await testOops(async () => expected);
    expect(actual).toBe(expected);
  });

  describe('when using custom error handlers', () => {
    it('will invoke the default handler for unknown exceptions', async () => {
      const error = new Error('oops');
      const handler = jest.fn();
      const result = await testOops(jest.fn().mockRejectedValue(error), {
        default: handler,
      });
      expect(result).toBeNull();
      expect(handler).toHaveBeenCalledWith(error);
    });

    it('will invoke the handler for the status code of the error', async () => {
      const handler = jest.fn();
      const result = await testOops(
        jest.fn().mockRejectedValue(getErrorResponse(409)),
        {
          409: handler,
        },
      );
      expect(result).toBeNull();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('when falling back on default error handlers', () => {
    it('will invoke default handler for unknown exceptions', async () => {
      const error = new Error('oops');
      const result = await testOops(jest.fn().mockRejectedValue(error));
      const toasts = useToasts(pinia);
      expect(result).toBeNull();
      expect(toasts.toasts[0]).toMatchObject(ServerErrorToast);
    });

    it('will logout users if their session expires', async () => {
      const currentUser = useCurrentUser(pinia);
      currentUser.user = BasicUser;

      const result = await testOops(
        jest.fn().mockRejectedValue(getErrorResponse(401)),
      );

      expect(result).toBeNull();
      expect(currentUser.user).toBeNull();
    });

    it('will show a toast on 403 errors', async () => {
      const toasts = useToasts(pinia);

      const result = await testOops(
        jest.fn().mockRejectedValue(getErrorResponse(403)),
      );

      expect(result).toBeNull();
      expect(toasts.toasts[0]).toMatchObject(ForbiddenErrorToast);
    });

    it('will redirect to 404 page on not found errors', async () => {
      const result = await testOops(
        jest.fn().mockRejectedValue(getErrorResponse(404)),
      );
      expect(result).toBeNull();
      expect(router.currentRoute.value.fullPath).toBe('/notFound');
    });
  });
});
