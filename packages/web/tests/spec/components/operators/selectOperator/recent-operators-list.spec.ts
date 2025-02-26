import { ApiClient, OperatorDTO, OperatorSchema } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import RecentOperatorsList from 'src/components/operators/selectOperator/recent-operators-list.vue';
import SelectOperatorListItem from 'src/components/operators/selectOperator/select-operator-list-item.vue';
import { useCurrentUser } from 'src/store';
import { createRouter } from 'tests/fixtures/create-router';
import TestOperators from 'tests/fixtures/dive-operators.json';
import { BasicUser } from 'tests/fixtures/users';
import { Router } from 'vue-router';

describe('RecentOperatorsList component', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof RecentOperatorsList>;
  let testOperators: OperatorDTO[];
  let getRecentOperatorsSpy: jest.SpyInstance;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/logbook/:username',
        component: RecentOperatorsList,
      },
    ]);
  });

  beforeEach(async () => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };

    currentUser.user = { ...BasicUser };
    await router.push(`/logbook/${BasicUser.username}`);

    testOperators = OperatorSchema.array().parse(
      TestOperators.data.slice(0, 10),
    );
    getRecentOperatorsSpy = jest
      .spyOn(client.logEntries, 'getMostRecentDiveOperators')
      .mockResolvedValue(testOperators);
  });

  it('will render a list of recent operators', async () => {
    const wrapper = mount(RecentOperatorsList, opts);
    await flushPromises();

    expect(getRecentOperatorsSpy).toHaveBeenCalledWith(BasicUser.username);
    const items = wrapper.findAllComponents(SelectOperatorListItem);
    expect(items).toHaveLength(testOperators.length);
    items.forEach((item, index) => {
      expect(item.props('operator')).toEqual(testOperators[index]);
    });
  });

  it('will show current operator if it is set', async () => {
    getRecentOperatorsSpy.mockResolvedValue([]);
    const wrapper = mount(RecentOperatorsList, opts);
    await wrapper.setProps({ currentOperator: testOperators[0] });
    await flushPromises();

    const items = wrapper.findAllComponents(SelectOperatorListItem);
    expect(items).toHaveLength(1);
    expect(items[0].props('operator')).toEqual(testOperators[0]);
  });

  it('will emit an operator-selected event when an operator is clicked', async () => {
    const wrapper = mount(RecentOperatorsList, opts);
    await wrapper.setProps({ currentOperator: testOperators[0] });
    await flushPromises();

    const items = wrapper.findAllComponents(SelectOperatorListItem);
    items[0].vm.$emit('select', testOperators[0]);
    items[1].vm.$emit('select', testOperators[1]);

    expect(wrapper.emitted('operator-selected')).toEqual([
      [testOperators[0]],
      [testOperators[1]],
    ]);
  });
});
