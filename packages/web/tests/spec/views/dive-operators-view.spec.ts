import {
  AccountTier,
  ApiClient,
  CreateOrUpdateDiveOperatorDTO,
  DiveOperator,
  DiveOperatorDTO,
  Fetcher,
  HttpException,
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
import { ToastType } from '../../../src/common';
import DiveOperatorsListItem from '../../../src/components/operators/dive-operators-list-item.vue';
import EditDiveOperator from '../../../src/components/operators/edit-dive-operator.vue';
import ViewDiveOperator from '../../../src/components/operators/view-dive-operator.vue';
import { FeaturesServiceKey } from '../../../src/featrues';
import {
  useCurrentUser,
  useDiveOperators,
  useToasts,
} from '../../../src/store';
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
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof DiveOperatorsView>;

  beforeAll(() => {
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
    testData = SearchDiveOperatorsResponseSchema.parse(TestData);
    features.flags[ManageDiveOperatorsFeature.key] = true;
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    diveOperators = useDiveOperators(pinia);
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

    it('will allow a shop owner to edit an existing shop', async () => {
      const existing: DiveOperatorDTO = {
        ...testData.operators[0],
        owner: ShopOwner.profile,
      };
      const update: CreateOrUpdateDiveOperatorDTO = {
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
      diveOperators.results.operators = [existing];
      diveOperators.results.totalCount = 1;

      const operator = new DiveOperator(fetcher, existing);
      const saveSpy = jest.spyOn(operator, 'save').mockResolvedValue();
      jest.spyOn(client.diveOperators, 'wrapDTO').mockReturnValue(operator);

      const wrapper = mount(DiveOperatorsView, opts);
      await flushPromises();

      const item = wrapper.getComponent(DiveOperatorsListItem);
      item.get(`[data-testid="select-${existing.slug}"]`).trigger('click');
      await flushPromises();

      const editor = wrapper.getComponent(EditDiveOperator);
      editor.vm.$emit('save', update);
      await flushPromises();

      expect(operator.toJSON()).toEqual({
        ...existing,
        ...update,
      });
      expect(saveSpy).toHaveBeenCalled();
      expect(wrapper.findComponent(EditDiveOperator).exists()).toBe(false);
    });

    it('will handle a conflict error when saving an operator', async () => {
      const existing: DiveOperatorDTO = {
        ...testData.operators[0],
        owner: ShopOwner.profile,
      };
      const update: CreateOrUpdateDiveOperatorDTO = {
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
      diveOperators.results.operators = [existing];
      diveOperators.results.totalCount = 1;

      const operator = new DiveOperator(fetcher, existing);
      const saveSpy = jest.spyOn(operator, 'save').mockRejectedValue(
        new HttpException(409, 'Conflict', 'Nope', {
          message: 'Nope',
          method: 'PUT',
          path: `/shops/${existing.slug}`,
          status: 409,
        }),
      );
      jest.spyOn(client.diveOperators, 'wrapDTO').mockReturnValue(operator);

      const wrapper = mount(DiveOperatorsView, opts);
      await flushPromises();

      const item = wrapper.getComponent(DiveOperatorsListItem);
      item.get(`[data-testid="select-${existing.slug}"]`).trigger('click');
      await flushPromises();

      const editor = wrapper.getComponent(EditDiveOperator);
      editor.vm.$emit('save', update);
      await flushPromises();

      expect(operator.toJSON()).toEqual({
        ...existing,
        ...update,
      });
      expect(saveSpy).toHaveBeenCalled();
      expect(wrapper.findComponent(EditDiveOperator).isVisible()).toBe(true);

      expect(toasts.toasts).toHaveLength(1);
      expect(toasts.toasts[0].type).toBe(ToastType.Warning);
      expect(toasts.toasts[0].message).toBe(
        'Unable to save dive shop. URL slug is already in use. Please change your slug to make it unique and then try again.',
      );
    });

    it('will display a dive shop in read-only mode when viewed by a user who is not the owner', async () => {
      currentUser.user = BasicUser;
      const operator = testData.operators[0];
      diveOperators.results.operators = [operator];
      diveOperators.results.totalCount = 1;

      const wrapper = mount(DiveOperatorsView, opts);
      await flushPromises();

      await wrapper
        .get(`[data-testid="select-${operator.slug}"]`)
        .trigger('click');
      const viewer = wrapper.getComponent(ViewDiveOperator);
      expect(viewer.isVisible()).toBe(true);
      expect(viewer.props('operator')).toEqual(operator);
    });

    it('will allow user to load more results', async () => {
      diveOperators.results.operators = testData.operators.slice(0, 10);
      diveOperators.results.totalCount = 20;

      const wrapper = mount(DiveOperatorsView, opts);
      await flushPromises();

      const spy = jest
        .spyOn(client.diveOperators, 'searchDiveOperators')
        .mockResolvedValue({
          operators: testData.operators
            .slice(10, 20)
            .map((op) => new DiveOperator(fetcher, op)),
          totalCount: 20,
        });

      await wrapper.get('[data-testid="operators-load-more"]').trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith({
        skip: 10,
      });
      expect(diveOperators.results.operators).toHaveLength(20);
      expect(diveOperators.results.operators).toEqual(
        testData.operators.slice(0, 20),
      );

      const items = wrapper.findAllComponents(DiveOperatorsListItem);
      expect(items).toHaveLength(20);
      items.forEach((item, i) => {
        expect(item.props('operator')).toEqual(testData.operators[i]);
      });
    });

    it('will retain search criteria while performing "load more" action', async () => {
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

      diveOperators.results.operators = testData.operators.slice(0, 10);
      diveOperators.results.totalCount = 20;

      const wrapper = mount(DiveOperatorsView, opts);
      await flushPromises();

      const spy = jest
        .spyOn(client.diveOperators, 'searchDiveOperators')
        .mockResolvedValue({
          operators: testData.operators
            .slice(10, 20)
            .map((op) => new DiveOperator(fetcher, op)),
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
      });
      expect(diveOperators.results.operators).toHaveLength(20);
      expect(diveOperators.results.operators).toEqual(
        testData.operators.slice(0, 20),
      );

      const items = wrapper.findAllComponents(DiveOperatorsListItem);
      expect(items).toHaveLength(20);
      items.forEach((item, i) => {
        expect(item.props('operator')).toEqual(testData.operators[i]);
      });
    });
  });
});
