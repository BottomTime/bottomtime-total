import { ApiClient, AppMetricsDTO } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import AppMetrics from '../../../../src/components/home/app-metrics.vue';
import { createAxiosError } from '../../../fixtures/create-axios-error';
import { createRouter } from '../../../fixtures/create-router';

describe('AppMetrics component', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof AppMetrics>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will request and display app metrics', async () => {
    const metrics: AppMetricsDTO = {
      users: {
        total: 24047,
        active: 1489,
        activeLastMonth: 12484,
      },
      diveSites: {
        total: 43749,
      },
      logEntries: {
        total: 1047540,
        addedLastMonth: 18437,
        addedLastWeek: 739,
      },
    };
    jest.spyOn(client, 'getAppMetrics').mockResolvedValue(metrics);
    const wrapper = mount(AppMetrics, opts);
    await flushPromises();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render error message if request for metrics fails', async () => {
    jest.spyOn(client, 'getAppMetrics').mockRejectedValue(
      createAxiosError({
        message: 'splode!',
        method: 'GET',
        path: '/api/metrics',
        status: 500,
      }),
    );
    const wrapper = mount(AppMetrics, opts);
    await flushPromises();
    expect(wrapper.text()).toMatchSnapshot();
  });
});
