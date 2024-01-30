import { mount } from '@vue/test-utils';
import axios from 'axios';
import AxiosAdapter from 'axios-mock-adapter';
import { Pinia, createPinia } from 'pinia';
import { defineComponent, onMounted } from 'vue';
import { createMemoryHistory, createRouter, Router } from 'vue-router';
import {
  ErrorHandlers,
  ForbiddenErrorToast,
  NetworkErrorToast,
  ServerErrorToast,
  useOops,
} from '../../src/oops';
import { useCurrentUser, useToasts } from '../../src/store';
import { BasicUser } from '../fixtures/users';

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
  let axiosAdapter: AxiosAdapter;

  beforeAll(() => {
    axiosAdapter = new AxiosAdapter(axios);
  });

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

  afterEach(() => {
    axiosAdapter.reset();
  });

  afterAll(() => {
    axiosAdapter.restore();
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

    it('will invoke the network error handler for network errors', async () => {
      const handler = jest.fn();
      axiosAdapter.onGet('/nope').networkErrorOnce();
      const result = await testOops(() => axios.get('/nope'), {
        networkError: handler,
      });
      expect(result).toBeNull();
      expect(handler).toHaveBeenCalled();
    });

    it('will invoke the handler for the status code of the error', async () => {
      const handler = jest.fn();
      axiosAdapter.onGet('/nope').reply(409);
      const result = await testOops(async () => await axios.get('/nope'), {
        409: handler,
      });
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

    it('will invoke default network error handler for network errors', async () => {
      axiosAdapter.onGet('/nope').networkErrorOnce();
      const result = await testOops(async () => axios.get('/nope'));
      expect(result).toBeNull();
      const toasts = useToasts(pinia);
      expect(toasts.toasts[0]).toMatchObject(NetworkErrorToast);
    });

    it('will logout users if their session expires', async () => {
      const currentUser = useCurrentUser(pinia);
      currentUser.user = BasicUser;
      axiosAdapter.onGet('/nope').reply(401);

      const result = await testOops(async () => await axios.get('/nope'));

      expect(result).toBeNull();
      expect(currentUser.user).toBeNull();
    });

    it('will show a toast on 403 errors', async () => {
      const toasts = useToasts(pinia);
      axiosAdapter.onGet('/nope').reply(403);

      const result = await testOops(async () => await axios.get('/nope'));

      expect(result).toBeNull();
      expect(toasts.toasts[0]).toMatchObject(ForbiddenErrorToast);
    });

    it('will redirect to 404 page on not found errors', async () => {
      axiosAdapter.onGet('/nope').reply(404);

      const result = await testOops(async () => await axios.get('/nope'));
      expect(result).toBeNull();
      expect(router.currentRoute.value.fullPath).toBe('/notFound');
    });
  });
});
