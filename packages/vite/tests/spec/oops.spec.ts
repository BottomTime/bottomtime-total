import { mount } from '@vue/test-utils';
import axios, { AxiosError, isAxiosError } from 'axios';
import { Response, Server } from 'miragejs';
import { Pinia, createPinia } from 'pinia';
import { defineComponent, nextTick, onMounted } from 'vue';
import { createMemoryHistory, createRouter, Router } from 'vue-router';
import { createServer } from '../fixtures/create-server';
import {
  ErrorHandlers,
  ForbiddenErrorToast,
  NetworkErrorToast,
  ServerErrorToast,
  useOops,
} from '../../src/oops';
import { useCurrentUser, useToasts } from '../../src/store';
import { User } from '../../src/client/user';
import { BasicUser } from '../fixtures/users';
import { resolve } from 'path';

const NetworkError = new AxiosError('Nope', 'ERR_NETWORK');

let pinia: Pinia;
let router: Router;

function testOops(
  fn: () => string | Promise<string>,
  handlers?: Partial<ErrorHandlers>,
): Promise<string | null> {
  return new Promise((resolve) => {
    const testComponent = defineComponent({
      template: '<div></div>',
      setup() {
        const oops = useOops();

        onMounted(async () => {
          const result = await oops<string>(fn, handlers);
          resolve(result);
        });
      },
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
    let server: Server;

    beforeAll(() => {
      server = createServer();
    });

    afterAll(() => {
      server.shutdown();
    });

    it('will invoke the default handler for unknown exceptions', async () => {
      const error = new Error('oops');
      const handler = jest.fn();
      const result = await testOops(jest.fn().mockRejectedValue(error), {
        default: handler,
      });
      expect(result).toBeNull();
      expect(handler).toHaveBeenCalledWith(error);
    });

    it('will invoke the network error handler for network errors', async () => {
      const handler = jest.fn();
      const result = await testOops(jest.fn().mockRejectedValue(NetworkError), {
        networkError: handler,
      });
      expect(result).toBeNull();
      expect(handler).toHaveBeenCalledWith(NetworkError);
    });

    it('will invoke the handler for the status code of the error', async () => {
      const handler = jest.fn();
      server.get('/nope', () => new Response(409, {}, {}));
      const result = await testOops(async () => await axios.get('/nope'), {
        409: handler,
      });
      expect(result).toBeNull();
      expect(handler).toHaveBeenCalled();

      const error: AxiosError = handler.mock.lastCall[0];
      expect(isAxiosError(error)).toBe(true);
      expect(error.response?.status).toEqual(409);
    });
  });

  describe('when falling back on default error handlers', () => {
    let server: Server;

    beforeAll(() => {
      server = createServer();
    });

    afterAll(() => {
      server.shutdown();
    });

    it('will invoke default handler for unknown exceptions', async () => {
      const error = new Error('oops');
      const result = await testOops(jest.fn().mockRejectedValue(error));
      const toasts = useToasts(pinia);
      expect(result).toBeNull();
      expect(toasts.toasts[0]).toMatchObject(ServerErrorToast);
    });

    it('will invoke default network error handler for network errors', async () => {
      const result = await testOops(jest.fn().mockRejectedValue(NetworkError));
      expect(result).toBeNull();
      const toasts = useToasts(pinia);
      expect(toasts.toasts[0]).toMatchObject(NetworkErrorToast);
    });

    it('will logout users if their session expires', async () => {
      const currentUser = useCurrentUser(pinia);
      currentUser.user = new User(BasicUser);
      server.get('/nope', () => new Response(401, {}, {}));

      const result = await testOops(async () => await axios.get('/nope'));

      expect(result).toBeNull();
      expect(currentUser.user).toBeNull();
    });

    it('will show a toast on 403 errors', async () => {
      const toasts = useToasts(pinia);
      server.get('/nope', () => new Response(403, {}, {}));

      const result = await testOops(async () => await axios.get('/nope'));

      expect(result).toBeNull();
      expect(toasts.toasts[0]).toMatchObject(ForbiddenErrorToast);
    });

    it('will redirect to 404 page on not found errors', async () => {
      server.get('/nope', () => new Response(404, {}, {}));

      const result = await testOops(async () => await axios.get('/nope'));
      expect(result).toBeNull();
      expect(router.currentRoute.value.fullPath).toBe('/notFound');
    });
  });
});
