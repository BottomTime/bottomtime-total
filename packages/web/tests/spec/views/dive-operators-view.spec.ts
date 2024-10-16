import {
  AccountTier,
  ApiClient,
  CreateOrUpdateDiveOperatorDTO,
  DiveOperator,
  DiveOperatorDTO,
  Fetcher,
  SearchDiveOperatorsResponseDTO,
  SearchDiveOperatorsResponseSchema,
  UserDTO,
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

import { ApiClientKey } from '../../../src/api-client';
import DiveOperatorsListItem from '../../../src/components/operators/dive-operators-list-item.vue';
import EditDiveOperator from '../../../src/components/operators/edit-dive-operator.vue';
import { FeaturesServiceKey } from '../../../src/featrues';
import { useCurrentUser, useDiveOperators } from '../../../src/store';
import DiveOperatorsView from '../../../src/views/dive-operators-view.vue';
import { ConfigCatClientMock } from '../../config-cat-client-mock';
import { createRouter } from '../../fixtures/create-router';
import TestData from '../../fixtures/dive-operators.json';
import { BasicUser } from '../../fixtures/users';

describe('Dive operators view', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let features: ConfigCatClientMock;
  let router: Router;
  let testData: SearchDiveOperatorsResponseDTO;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let diveOperators: ReturnType<typeof useDiveOperators>;
  let opts: ComponentMountingOptions<typeof DiveOperatorsView>;

  beforeAll(() => {
    testData = SearchDiveOperatorsResponseSchema.parse(TestData);
    fetcher = new Fetcher();
    client = new ApiClient();
    router = createRouter([
      {
        path: '/shops',
        component: DiveOperatorsView,
      },
    ]);
    features = new ConfigCatClientMock();
  });

  beforeEach(async () => {
    features.flags[ManageDiveOperatorsFeature.key] = true;
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    diveOperators = useDiveOperators(pinia);
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
  });

  describe('when performing server-side render', () => {
    it('will render "not found" page when feature flag is turned off', async () => {
      features.flags[ManageDiveOperatorsFeature.key] = false;
      const div = document.createElement('div');
      div.innerHTML = await renderToString(DiveOperatorsView, {
        global: opts.global,
      });

      const notFound = div.querySelector('[data-testid="not-found-message"]');
      expect(notFound).not.toBeNull();

      const list = div.querySelector('[data-testid="operators-list"]');
      expect(list).toBeNull();
    });

    it('will perform a basic search when now query params are provided', async () => {
      const spy = jest
        .spyOn(client.diveOperators, 'searchDiveOperators')
        .mockResolvedValue({
          operators: testData.operators.map(
            (op) => new DiveOperator(fetcher, op),
          ),
          totalCount: testData.totalCount,
        });
      const div = document.createElement('div');
      div.innerHTML = await renderToString(DiveOperatorsView, {
        global: opts.global,
      });
      expect(spy).toHaveBeenCalledWith({});

      const count = div.querySelector<HTMLParagraphElement>(
        '[data-testid="operators-count"]',
      );
      expect(count!.innerHTML).toMatchSnapshot();

      const items = div.querySelectorAll('[data-testid="operators-list"]>li');
      expect(items).toHaveLength(testData.operators.length + 1);
      testData.operators.forEach((op, i) => {
        expect(items[i].innerHTML).toContain(op.name);
      });

      expect(diveOperators.results).toEqual(testData);
    });

    it('will perform a more complicated search when query params are provided', async () => {
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
      const spy = jest
        .spyOn(client.diveOperators, 'searchDiveOperators')
        .mockResolvedValue({
          operators: [],
          totalCount: 0,
        });
      const div = document.createElement('div');
      div.innerHTML = await renderToString(DiveOperatorsView, {
        global: opts.global,
      });
      expect(spy).toHaveBeenCalledWith({
        query: query.query,
        location: { lat: 20.42, lon: -87.32 },
        radius: 350,
        owner: query.owner,
      });

      const count = div.querySelector<HTMLParagraphElement>(
        '[data-testid="operators-count"]',
      );
      expect(count!.innerHTML).toMatchSnapshot();

      const items = div.querySelectorAll('[data-testid="operators-list"]>li');
      expect(items).toHaveLength(1);
      expect(items[0].innerHTML).toContain(
        'There are no dive shops that match your search criteria',
      );

      expect(diveOperators.results).toEqual({
        operators: [],
        totalCount: 0,
      });
    });
  });

  describe('when rendering on client side', () => {
    const ShopOwner: UserDTO = {
      ...BasicUser,
      accountTier: AccountTier.ShopOwner,
    };

    it('will render a result set', async () => {
      diveOperators.results.operators = testData.operators;
      diveOperators.results.totalCount = testData.totalCount;

      const wrapper = mount(DiveOperatorsView, opts);
      await flushPromises();

      const items = wrapper.findAllComponents(DiveOperatorsListItem);
      expect(items).toHaveLength(testData.operators.length);
      items.forEach((item, i) => {
        expect(item.props('operator')).toEqual(testData.operators[i]);
      });
    });

    it('will allow a user to perform a search', async () => {
      currentUser.user = ShopOwner;
      diveOperators.results.operators = testData.operators;
      diveOperators.results.totalCount = testData.totalCount;

      const expected: SearchDiveOperatorsResponseDTO = {
        operators: testData.operators.slice(0, 3),
        totalCount: 3,
      };

      const spy = jest
        .spyOn(client.diveOperators, 'searchDiveOperators')
        .mockResolvedValue({
          operators: expected.operators.map(
            (op) => new DiveOperator(fetcher, op),
          ),
          totalCount: expected.totalCount,
        });

      const wrapper = mount(DiveOperatorsView, opts);
      await flushPromises();

      await wrapper.get('input#operator-search').setValue('deep site');
      await wrapper.get('input#operator-show-mine').setValue(true);
      await wrapper.get('button#btn-operator-search').trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith({
        query: 'deep site',
        owner: ShopOwner.username,
      });
      expect(wrapper.get('[data-testid="operators-count"]').text()).toBe(
        'Showing 3 of 3 dive shop(s)',
      );

      const items = wrapper.findAllComponents(DiveOperatorsListItem);
      expect(items).toHaveLength(3);
    });

    it('will allow a shop owner to create a new dive shop', async () => {
      diveOperators.results.operators = [];
      diveOperators.results.totalCount = 0;
      const create: CreateOrUpdateDiveOperatorDTO = {
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
      const result: DiveOperatorDTO = {
        id: 'new-shop',
        owner: ShopOwner.profile,
        createdAt: new Date('2021-01-01T00:00:00Z'),
        updatedAt: new Date('2021-01-01T00:00:00Z'),
        verified: false,
        ...create,
      };
      const spy = jest
        .spyOn(client.diveOperators, 'createDiveOperator')
        .mockResolvedValue(new DiveOperator(fetcher, result));

      currentUser.user = ShopOwner;
      diveOperators.results.operators = testData.operators;
      diveOperators.results.totalCount = testData.totalCount;

      const wrapper = mount(DiveOperatorsView, opts);
      await flushPromises();

      await wrapper
        .get('[data-testid="operators-create-shop"]')
        .trigger('click');
      const editor = wrapper.getComponent(EditDiveOperator);
      expect(editor.isVisible()).toBe(true);
      editor.vm.$emit('save', create);
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(create);
      expect(
        wrapper.getComponent(DiveOperatorsListItem).props('operator'),
      ).toEqual(result);
      expect(wrapper.findComponent(EditDiveOperator).exists()).toBe(false);
    });
  });
});
