import {
  AccountTier,
  ApiClient,
  ApiList,
  OperatorDTO,
  SearchOperatorsResponseSchema,
  UserDTO,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import StarRatingStub from 'tests/stubs/star-rating-stub.vue';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import OperatorsListItem from '../../../../src/components/operators/operators-list-item.vue';
import ViewOperator from '../../../../src/components/operators/view-operator.vue';
import { FeaturesServiceKey } from '../../../../src/featrues';
import { useCurrentUser } from '../../../../src/store';
import OperatorsView from '../../../../src/views/operators/operators-view.vue';
import { ConfigCatClientMock } from '../../../config-cat-client-mock';
import { createRouter } from '../../../fixtures/create-router';
import TestData from '../../../fixtures/dive-operators.json';
import { BasicUser } from '../../../fixtures/users';

const ShopOwner: UserDTO = {
  ...BasicUser,
  accountTier: AccountTier.ShopOwner,
};

describe('Operators view', () => {
  let client: ApiClient;
  let features: ConfigCatClientMock;
  let router: Router;
  let testData: ApiList<OperatorDTO>;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof OperatorsView>;
  let searchSpy: jest.SpyInstance;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/shops',
        component: OperatorsView,
      },
    ]);
    features = new ConfigCatClientMock();
  });

  beforeEach(async () => {
    testData = SearchOperatorsResponseSchema.parse(TestData);
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    await router.push('/shops');

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [FeaturesServiceKey as symbol]: features,
        },
        stubs: {
          teleport: true,
          StarRating: StarRatingStub,
        },
      },
    };

    searchSpy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValue(testData);
  });

  it('will render with default search params when no query string is provided', async () => {
    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    expect(searchSpy).toHaveBeenCalledWith({
      limit: 50,
    });
    const items = wrapper.findAllComponents(OperatorsListItem);
    expect(items).toHaveLength(testData.data.length);
    items.forEach((item, i) => {
      expect(item.props('operator')).toEqual(testData.data[i]);
    });
  });

  it('will render with a search query when query string is provided', async () => {
    const query = {
      query: 'deep site',
      location: '20.42,-87.32',
      radius: 350,
      owner: 'the_dude',
    };
    await router.push({
      path: '/shops',
      query,
    });

    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    expect(searchSpy).toHaveBeenCalledWith({
      location: {
        lat: 20.42,
        lon: -87.32,
      },
      owner: 'the_dude',
      query: 'deep site',
      radius: 350,
      limit: 50,
    });
    const items = wrapper.findAllComponents(OperatorsListItem);
    expect(items).toHaveLength(testData.data.length);
    items.forEach((item, i) => {
      expect(item.props('operator')).toEqual(testData.data[i]);
    });
  });

  it('will render with default search params if query string is invalid', async () => {
    const query = {
      query: 'deep site',
      location: 'somewhere',
      radius: -350,
    };
    await router.push({
      path: '/shops',
      query,
    });

    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    expect(searchSpy).toHaveBeenCalledWith({
      limit: 50,
    });
    const items = wrapper.findAllComponents(OperatorsListItem);
    expect(items).toHaveLength(testData.data.length);
    items.forEach((item, i) => {
      expect(item.props('operator')).toEqual(testData.data[i]);
    });
  });

  it('will allow a user to perform a search', async () => {
    currentUser.user = ShopOwner;
    const expected: ApiList<OperatorDTO> = {
      data: testData.data.slice(0, 3),
      totalCount: 3,
    };

    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    const spy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValue(expected);

    await wrapper.get('input#operator-search').setValue('deep site');
    await wrapper.get('input#operator-show-mine').setValue(true);
    await wrapper.get('input#operator-show-inactive').setValue(true);
    await wrapper.get('button#btn-operator-search').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      query: 'deep site',
      owner: ShopOwner.username,
      showInactive: true,
      limit: 50,
    });
    expect(wrapper.get('[data-testid="operators-count"]').text()).toBe(
      'Showing 3 of 3 dive shop(s)',
    );

    const items = wrapper.findAllComponents(OperatorsListItem);
    expect(items).toHaveLength(3);
  });

  it('will allow a shop owner to create a new dive shop', async () => {
    currentUser.user = ShopOwner;
    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    await wrapper.get('[data-testid="operators-create-shop"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/shops/createNew');
  });

  it('will display a dive shop in read-only mode when viewed by a user who is not the owner', async () => {
    currentUser.user = BasicUser;
    const operator = testData.data[0];
    searchSpy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValue({
        data: [operator],
        totalCount: 1,
      });

    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    await wrapper
      .get(`[data-testid="select-${operator.slug}"]`)
      .trigger('click');
    const viewer = wrapper.getComponent(ViewOperator);
    expect(viewer.isVisible()).toBe(true);
    expect(viewer.props('operator')).toEqual(operator);
  });

  it('will allow user to load more results', async () => {
    jest.spyOn(client.operators, 'searchOperators').mockResolvedValueOnce({
      data: testData.data.slice(0, 10),
      totalCount: 20,
    });

    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    const spy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValueOnce({
        data: testData.data.slice(10, 20),
        totalCount: 20,
      });

    await wrapper.get('[data-testid="operators-load-more"]').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      skip: 10,
      limit: 50,
    });

    const results = wrapper.findAllComponents(OperatorsListItem);
    expect(results).toHaveLength(20);
    results.forEach((result, index) => {
      expect(result.props('operator')).toEqual(testData.data[index]);
    });
  });

  it('will retain search criteria while performing "load more" action', async () => {
    jest.spyOn(client.operators, 'searchOperators').mockResolvedValue({
      data: testData.data.slice(0, 10),
      totalCount: 20,
    });
    const query = {
      query: 'deep site',
      location: '20.42,-87.32',
      radius: 350,
      owner: 'the_dude',
    };
    await router.replace({
      path: '/shops',
      query,
    });

    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    const spy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValue({
        data: testData.data.slice(10, 20),
        totalCount: 20,
      });

    wrapper.get('[data-testid="operators-load-more"]').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      location: {
        lat: 20.42,
        lon: -87.32,
      },
      owner: 'the_dude',
      query: 'deep site',
      radius: 350,
      skip: 10,
      limit: 50,
    });

    const results = wrapper.findAllComponents(OperatorsListItem);
    expect(results).toHaveLength(20);
    results.forEach((result, index) => {
      expect(result.props('operator')).toEqual(testData.data[index]);
    });
  });
});
