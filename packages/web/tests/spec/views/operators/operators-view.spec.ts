import {
  AccountTier,
  ApiClient,
  CreateOrUpdateOperatorDTO,
  Fetcher,
  Operator,
  OperatorDTO,
  SearchOperatorsResponseDTO,
  SearchOperatorsResponseSchema,
  UserDTO,
  VerificationStatus,
} from '@bottomtime/api';
import { ManageDiveOperatorsFeature } from '@bottomtime/common';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
  renderToString,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import { ToastType } from '../../../../src/common';
import EditOperator from '../../../../src/components/operators/edit-operator.vue';
import OperatorsListItem from '../../../../src/components/operators/operators-list-item.vue';
import ViewOperator from '../../../../src/components/operators/view-operator.vue';
import { FeaturesServiceKey } from '../../../../src/featrues';
import { useCurrentUser, useToasts } from '../../../../src/store';
import OperatorsView from '../../../../src/views/operators/operators-view.vue';
import { ConfigCatClientMock } from '../../../config-cat-client-mock';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import TestData from '../../../fixtures/dive-operators.json';
import { BasicUser } from '../../../fixtures/users';

const ShopOwner: UserDTO = {
  ...BasicUser,
  accountTier: AccountTier.ShopOwner,
};

describe('Operators view', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let features: ConfigCatClientMock;
  let router: Router;
  let testData: SearchOperatorsResponseDTO;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof OperatorsView>;
  let searchSpy: jest.SpyInstance;

  beforeAll(() => {
    fetcher = new Fetcher();
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
    features.flags[ManageDiveOperatorsFeature.key] = true;
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    toasts = useToasts(pinia);

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
        },
      },
    };

    searchSpy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValue({
        operators: testData.operators.map((op) => new Operator(fetcher, op)),
        totalCount: testData.totalCount,
      });
  });

  it('will render with default search params when no query string is provided', async () => {
    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    expect(searchSpy).toHaveBeenCalledWith({
      limit: 50,
    });
    const items = wrapper.findAllComponents(OperatorsListItem);
    expect(items).toHaveLength(testData.operators.length);
    items.forEach((item, i) => {
      expect(item.props('operator')).toEqual(testData.operators[i]);
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
    expect(items).toHaveLength(testData.operators.length);
    items.forEach((item, i) => {
      expect(item.props('operator')).toEqual(testData.operators[i]);
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
    expect(items).toHaveLength(testData.operators.length);
    items.forEach((item, i) => {
      expect(item.props('operator')).toEqual(testData.operators[i]);
    });
  });

  it('will allow a user to perform a search', async () => {
    currentUser.user = ShopOwner;
    const expected: SearchOperatorsResponseDTO = {
      operators: testData.operators.slice(0, 3),
      totalCount: 3,
    };

    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    const spy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValue({
        operators: expected.operators.map((op) => new Operator(fetcher, op)),
        totalCount: expected.totalCount,
      });

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
    const create: CreateOrUpdateOperatorDTO = {
      active: true,
      name: 'New Shop',
      slug: 'new-shop',
      gps: {
        lat: 20.42,
        lon: -87.32,
      },
      address: '1234 Main St',
      phone: '555-555-5555',
      email: 'randy@newshop.com',
      description: 'A new dive shop',
      socials: {
        facebook: 'newshop',
        instagram: 'newshop',
        twitter: 'newshop',
        tiktok: 'newshop',
        youtube: 'newshop',
      },
      website: 'https://newshop.com',
    };
    const result: OperatorDTO = {
      id: 'new-shop',
      owner: ShopOwner.profile,
      createdAt: new Date('2021-01-01T00:00:00Z'),
      updatedAt: new Date('2021-01-01T00:00:00Z'),
      verificationStatus: VerificationStatus.Unverified,
      ...create,
    };
    const spy = jest
      .spyOn(client.operators, 'createOperator')
      .mockResolvedValue(new Operator(fetcher, result));

    currentUser.user = ShopOwner;

    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    await wrapper.get('[data-testid="operators-create-shop"]').trigger('click');
    const editor = wrapper.getComponent(EditOperator);
    expect(editor.isVisible()).toBe(true);
    editor.vm.$emit('save', create);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(create);
    expect(wrapper.getComponent(OperatorsListItem).props('operator')).toEqual(
      result,
    );
    expect(wrapper.findComponent(EditOperator).exists()).toBe(false);
  });

  it('will allow a shop owner to edit an existing shop', async () => {
    const existing: OperatorDTO = {
      ...testData.operators[0],
      owner: ShopOwner.profile,
    };
    const update: CreateOrUpdateOperatorDTO = {
      active: true,
      address: '1234 Main St',
      description: 'A new dive shop',
      name: 'New Shop',
      phone: '555-555-5555',
      slug: existing.slug,
      gps: existing.gps,
      email: existing.email,
      socials: existing.socials,
      website: existing.website,
    };
    const operator = new Operator(fetcher, existing);
    currentUser.user = ShopOwner;
    searchSpy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValue({
        operators: [operator],
        totalCount: 1,
      });

    const saveSpy = jest.spyOn(operator, 'save').mockResolvedValue();
    jest.spyOn(client.operators, 'wrapDTO').mockReturnValue(operator);

    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    const item = wrapper.getComponent(OperatorsListItem);
    item.get(`[data-testid="select-${existing.slug}"]`).trigger('click');
    await flushPromises();

    const editor = wrapper.getComponent(EditOperator);
    editor.vm.$emit('save', update);
    await flushPromises();

    expect(operator.toJSON()).toEqual({
      ...existing,
      ...update,
    });
    expect(saveSpy).toHaveBeenCalled();
    expect(wrapper.findComponent(EditOperator).exists()).toBe(false);
  });

  it('will handle a conflict error when saving an operator', async () => {
    const existing: OperatorDTO = {
      ...testData.operators[0],
      owner: ShopOwner.profile,
    };
    const update: CreateOrUpdateOperatorDTO = {
      active: true,
      address: '1234 Main St',
      description: 'A new dive shop',
      name: 'New Shop',
      phone: '555-555-5555',
      slug: existing.slug,
      gps: existing.gps,
      email: existing.email,
      socials: existing.socials,
      website: existing.website,
    };
    currentUser.user = ShopOwner;
    const operator = new Operator(fetcher, existing);
    searchSpy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValue({
        operators: [operator],
        totalCount: 1,
      });

    const saveSpy = jest
      .spyOn(operator, 'save')
      .mockRejectedValue(createHttpError(409));
    jest.spyOn(client.operators, 'wrapDTO').mockReturnValue(operator);

    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    const item = wrapper.getComponent(OperatorsListItem);
    item.get(`[data-testid="select-${existing.slug}"]`).trigger('click');
    await flushPromises();

    const editor = wrapper.getComponent(EditOperator);
    editor.vm.$emit('save', update);
    await flushPromises();

    expect(operator.toJSON()).toEqual({
      ...existing,
      ...update,
    });
    expect(saveSpy).toHaveBeenCalled();
    expect(wrapper.findComponent(EditOperator).isVisible()).toBe(true);

    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].type).toBe(ToastType.Warning);
    expect(toasts.toasts[0].message).toBe(
      'Unable to save dive shop. URL slug is already in use. Please change your slug to make it unique and then try again.',
    );
  });

  it('will display a dive shop in read-only mode when viewed by a user who is not the owner', async () => {
    currentUser.user = BasicUser;
    const operator = testData.operators[0];
    searchSpy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValue({
        operators: [new Operator(fetcher, operator)],
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
      operators: testData.operators
        .slice(0, 10)
        .map((op) => new Operator(fetcher, op)),
      totalCount: 20,
    });

    const wrapper = mount(OperatorsView, opts);
    await flushPromises();

    const spy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValueOnce({
        operators: testData.operators
          .slice(10, 20)
          .map((op) => new Operator(fetcher, op)),
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
      expect(result.props('operator')).toEqual(testData.operators[index]);
    });
  });

  it('will retain search criteria while performing "load more" action', async () => {
    jest.spyOn(client.operators, 'searchOperators').mockResolvedValue({
      operators: testData.operators
        .slice(0, 10)
        .map((op) => new Operator(fetcher, op)),
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
        operators: testData.operators
          .slice(10, 20)
          .map((op) => new Operator(fetcher, op)),
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
      expect(result.props('operator')).toEqual(testData.operators[index]);
    });
  });
});
