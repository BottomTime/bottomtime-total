import { ApiClient } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import RecentOperatorsList from 'src/components/operators/selectOperator/recent-operators-list.vue';
import SearchOperatorsForm from 'src/components/operators/selectOperator/search-operators-form.vue';
import SelectOperator from 'src/components/operators/selectOperator/select-operator.vue';
import { GeolocationKey } from 'src/geolocation';
import { createRouter } from 'tests/fixtures/create-router';
import { BasicUser } from 'tests/fixtures/users';
import { MockGeolocation } from 'tests/mock-geolocation';
import { Router } from 'vue-router';

describe('SelectOperator component', () => {
  let client: ApiClient;
  let router: Router;
  let geolocation: MockGeolocation;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof SelectOperator>;

  beforeAll(() => {
    client = new ApiClient();
    geolocation = new MockGeolocation();
    router = createRouter([
      {
        path: '/logbook/:username',
        component: SelectOperator,
      },
    ]);
  });

  beforeEach(async () => {
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [GeolocationKey as symbol]: geolocation,
        },
      },
    };

    await router.push(`/logbook/${BasicUser.username}`);
  });

  it('will default to recent operators tab', async () => {
    const spy = jest
      .spyOn(client.logEntries, 'getMostRecentDiveOperators')
      .mockResolvedValue([]);
    const wrapper = mount(SelectOperator, opts);
    await flushPromises();
    expect(wrapper.findComponent(RecentOperatorsList).isVisible()).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  it('will switch to search tab when search is clicked', async () => {
    jest
      .spyOn(client.logEntries, 'getMostRecentDiveOperators')
      .mockResolvedValue([]);
    const wrapper = mount(SelectOperator, opts);
    await wrapper.get('[data-testid="tab-search"]').trigger('click');
    expect(wrapper.findComponent(RecentOperatorsList).exists()).toBe(false);
    expect(wrapper.findComponent(SearchOperatorsForm).isVisible()).toBe(true);
  });
});
