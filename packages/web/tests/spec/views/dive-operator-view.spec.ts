import {
  AccountTier,
  ApiClient,
  CreateOrUpdateDiveOperatorDTO,
  DiveOperator,
  DiveOperatorDTO,
  Fetcher,
  HttpException,
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

import { ApiClientKey } from '../../../src/api-client';
import { ToastType } from '../../../src/common';
import EditDiveOperator from '../../../src/components/operators/edit-dive-operator.vue';
import ViewDiveOperator from '../../../src/components/operators/view-dive-operator.vue';
import { FeaturesServiceKey } from '../../../src/featrues';
import { LocationKey, MockLocation } from '../../../src/location';
import {
  useCurrentUser,
  useDiveOperators,
  useToasts,
} from '../../../src/store';
import DiveOperatorView from '../../../src/views/dive-operator-view.vue';
import { ConfigCatClientMock } from '../../config-cat-client-mock';
import { createRouter } from '../../fixtures/create-router';
import {
  BlankDiveOperator,
  FullDiveOperator,
  PartialDiveOperator,
} from '../../fixtures/dive-operators';
import { AdminUser, BasicUser } from '../../fixtures/users';

const ShopOwner: UserDTO = {
  ...BasicUser,
  accountTier: AccountTier.ShopOwner,
  profile: {
    ...BasicUser.profile,
    accountTier: AccountTier.ShopOwner,
  },
};

describe('Dive Operator view', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let features: ConfigCatClientMock;
  let location: MockLocation;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let diveOperators: ReturnType<typeof useDiveOperators>;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof DiveOperatorView>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    features = new ConfigCatClientMock();
    location = new MockLocation();
    router = createRouter([
      {
        path: '/shops/createNew',
        component: DiveOperatorView,
      },
      {
        path: '/shops/:shopKey',
        component: DiveOperatorView,
      },
    ]);
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    diveOperators = useDiveOperators(pinia);
    toasts = useToasts(pinia);
    features.flags[ManageDiveOperatorsFeature.key] = true;
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [FeaturesServiceKey as symbol]: features,
          [LocationKey as symbol]: location,
        },
        stubs: {
          teleport: true,
        },
      },
    };
  });

  describe('when rendering on the server side', () => {
    it('will render not found page if feature flag is off', async () => {
      features.flags[ManageDiveOperatorsFeature.key] = false;

      const div = document.createElement('div');
      div.innerHTML = await renderToString(DiveOperatorView, {
        global: opts.global,
      });

      expect(
        div.querySelector('[data-testid="view-operator-section"]'),
      ).toBeNull();
      expect(
        div.querySelector('[data-testid="not-found-message"]'),
      ).not.toBeNull();
    });

    it('will render not found page if operator is not found', async () => {
      await router.push('/shops/unknown-operator');

      const spy = jest
        .spyOn(client.diveOperators, 'getDiveOperator')
        .mockRejectedValue(
          new HttpException(404, 'Not found', 'Not found', {
            message: 'Not found',
            method: 'GET',
            path: '/dive-operators/unknown-operator',
            status: 404,
          }),
        );

      const div = document.createElement('div');
      div.innerHTML = await renderToString(DiveOperatorView, {
        global: opts.global,
      });

      expect(spy).toHaveBeenCalledWith('unknown-operator');
      expect(
        div.querySelector('[data-testid="view-operator-section"]'),
      ).toBeNull();
      expect(
        div.querySelector('[data-testid="not-found-message"]'),
      ).not.toBeNull();
    });

    it('will render dive operator details', async () => {
      await router.push(`/shops/${FullDiveOperator.slug}`);

      const spy = jest
        .spyOn(client.diveOperators, 'getDiveOperator')
        .mockResolvedValue(new DiveOperator(fetcher, FullDiveOperator));

      const div = document.createElement('div');
      div.innerHTML = await renderToString(DiveOperatorView, {
        global: opts.global,
      });

      expect(spy).toHaveBeenCalledWith(FullDiveOperator.slug);

      const html = div.querySelector('[data-testid="view-operator-section"]');
      expect(html).not.toBeNull();
      expect(html?.innerHTML).toMatchSnapshot();
    });

    it('will render in edit mode when the user is the shop owner', async () => {
      const operator: DiveOperatorDTO = {
        ...FullDiveOperator,
        owner: ShopOwner.profile,
      };
      currentUser.user = ShopOwner;
      await router.push(`/shops/${operator.slug}`);

      const spy = jest
        .spyOn(client.diveOperators, 'getDiveOperator')
        .mockResolvedValue(new DiveOperator(fetcher, operator));

      const div = document.createElement('div');
      div.innerHTML = await renderToString(DiveOperatorView, {
        global: opts.global,
      });

      expect(
        div.querySelector<HTMLInputElement>('input#operator-name')?.value,
      ).toBe(operator.name);
      expect(spy).toHaveBeenCalledWith(operator.slug);
    });
  });

  describe('when rendering on client side', () => {
    const update: CreateOrUpdateDiveOperatorDTO = {
      active: true,
      address: '1234 Main St',
      description: 'A new dive shop',
      name: 'New Shop',
      phone: '555-555-5555',
      slug: FullDiveOperator.slug,
      email: FullDiveOperator.email,
      gps: FullDiveOperator.gps,
      socials: FullDiveOperator.socials,
      website: FullDiveOperator.website,
    };

    const create: CreateOrUpdateDiveOperatorDTO = {
      active: true,
      address: '74 Main St',
      description: 'We do scuba stuff',
      name: 'Scuba Mega Shop',
      slug: 'scuba-mega-shop',
      phone: '555-555-5555',
      email: 'admin@scubamegashop.com',
      website: 'https://scubamegashop.com',
    };

    it('will allow user to view a dive operator', async () => {
      diveOperators.currentDiveOperator = { ...PartialDiveOperator };
      await router.push(`/shops/${PartialDiveOperator.slug}`);

      const wrapper = mount(DiveOperatorView, opts);
      await flushPromises();

      const viewer = wrapper.getComponent(ViewDiveOperator);
      expect(viewer.isVisible()).toBe(true);
      expect(viewer.props('operator')).toEqual(PartialDiveOperator);
    });

    it('will show not found if operator is not found', async () => {
      diveOperators.currentDiveOperator = null;
      await router.push('/shops/unknown-operator');

      const wrapper = mount(DiveOperatorView, opts);
      await flushPromises();

      expect(
        wrapper.find('[data-testid="not-found-message"]').isVisible(),
      ).toBe(true);
      expect(wrapper.findComponent(ViewDiveOperator).exists()).toBe(false);
    });

    it('will show login form if unauthenticated user tries to create a new operator', async () => {
      currentUser.user = null;
      diveOperators.currentDiveOperator = {
        ...BlankDiveOperator,
        owner: ShopOwner.profile,
      };
      await router.push('/shops/createNew');

      const wrapper = mount(DiveOperatorView, opts);
      await flushPromises();

      expect(
        wrapper.get('[data-testid="require-auth-anonymous"]').isVisible(),
      ).toBe(true);
      expect(wrapper.findComponent(EditDiveOperator).exists()).toBe(false);
    });

    it('will show forbidden message when a regular user tries to create a new operator', async () => {
      currentUser.user = {
        ...BasicUser,
        accountTier: AccountTier.Basic,
      };
      diveOperators.currentDiveOperator = {
        ...BlankDiveOperator,
        owner: BasicUser.profile,
      };

      const wrapper = mount(DiveOperatorView, opts);
      await flushPromises();

      expect(
        wrapper.find('[data-testid="forbidden-message"]').isVisible(),
      ).toBe(true);
      expect(wrapper.findComponent(EditDiveOperator).exists()).toBe(false);
    });

    it('will show forbidden message when a pro user tries to create a new operator', async () => {
      currentUser.user = {
        ...BasicUser,
        accountTier: AccountTier.Pro,
      };
      diveOperators.currentDiveOperator = {
        ...BlankDiveOperator,
        owner: BasicUser.profile,
      };

      const wrapper = mount(DiveOperatorView, opts);
      await flushPromises();

      expect(
        wrapper.find('[data-testid="forbidden-message"]').isVisible(),
      ).toBe(true);
      expect(wrapper.findComponent(EditDiveOperator).exists()).toBe(false);
    });

    it('will allow a shop owner to create a new dive operator', async () => {
      const expected: DiveOperatorDTO = {
        id: '31a6723a-88de-460c-af33-b2363b7aec47',
        createdAt: new Date('2024-01-10T10:54:08.909Z'),
        updatedAt: new Date('2024-10-09T18:44:28.447Z'),
        owner: ShopOwner.profile,
        verificationStatus: VerificationStatus.Unverified,
        ...create,
      };
      const spy = jest
        .spyOn(client.diveOperators, 'createDiveOperator')
        .mockResolvedValue(new DiveOperator(fetcher, expected));

      currentUser.user = ShopOwner;
      diveOperators.currentDiveOperator = {
        ...BlankDiveOperator,
        owner: ShopOwner.profile,
      };
      await router.push('/shops/createNew');

      const wrapper = mount(DiveOperatorView, opts);
      await flushPromises();

      wrapper.getComponent(EditDiveOperator).vm.$emit('save', create);
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(create);
      expect(router.currentRoute.value.path).toBe(`/shops/${expected.slug}`);
      expect(diveOperators.currentDiveOperator).toEqual(expected);
    });

    it('will allow an admin to create a new dive operator', async () => {
      const expected: DiveOperatorDTO = {
        id: '31a6723a-88de-460c-af33-b2363b7aec47',
        createdAt: new Date('2024-01-10T10:54:08.909Z'),
        updatedAt: new Date('2024-10-09T18:44:28.447Z'),
        owner: AdminUser.profile,
        verificationStatus: VerificationStatus.Unverified,
        ...create,
      };
      const spy = jest
        .spyOn(client.diveOperators, 'createDiveOperator')
        .mockResolvedValue(new DiveOperator(fetcher, expected));

      currentUser.user = AdminUser;
      diveOperators.currentDiveOperator = {
        ...BlankDiveOperator,
        owner: AdminUser.profile,
      };
      await router.push('/shops/createNew');

      const wrapper = mount(DiveOperatorView, opts);
      await flushPromises();

      wrapper.getComponent(EditDiveOperator).vm.$emit('save', create);
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(create);
      expect(router.currentRoute.value.path).toBe(`/shops/${expected.slug}`);
      expect(diveOperators.currentDiveOperator).toEqual(expected);
    });

    it('will show an error if there is a slug conflict when saving a new operator', async () => {
      const spy = jest
        .spyOn(client.diveOperators, 'createDiveOperator')
        .mockRejectedValue(
          new HttpException(409, 'Conflict', 'Conflict', {
            message: 'Conflict',
            method: 'POST',
            path: '/shops/createNew',
            status: 409,
          }),
        );

      currentUser.user = ShopOwner;
      diveOperators.currentDiveOperator = {
        ...BlankDiveOperator,
        owner: ShopOwner.profile,
      };
      await router.push('/shops/createNew');

      const wrapper = mount(DiveOperatorView, opts);
      await flushPromises();

      wrapper.getComponent(EditDiveOperator).vm.$emit('save', create);
      await flushPromises();

      expect(toasts.toasts).toHaveLength(1);
      expect(toasts.toasts[0].id).toBe('dive-operator-slug-taken');
      expect(toasts.toasts[0].type).toBe(ToastType.Warning);

      expect(spy).toHaveBeenCalledWith(create);
      expect(router.currentRoute.value.path).toBe('/shops/createNew');
      expect(diveOperators.currentDiveOperator).toEqual({
        ...BlankDiveOperator,
        owner: ShopOwner.profile,
      });
    });

    it('will allow a shop owner to update a dive operator', async () => {
      const operator = new DiveOperator(fetcher, { ...FullDiveOperator });
      const saveSpy = jest.spyOn(operator, 'save').mockResolvedValue();
      jest.spyOn(client.diveOperators, 'wrapDTO').mockReturnValue(operator);

      currentUser.user = ShopOwner;
      diveOperators.currentDiveOperator = {
        ...FullDiveOperator,
        owner: ShopOwner.profile,
      };
      await router.push(`/shops/${FullDiveOperator.slug}`);

      const wrapper = mount(DiveOperatorView, opts);
      await flushPromises();

      const editor = wrapper.getComponent(EditDiveOperator);
      expect(editor.isVisible()).toBe(true);
      editor.vm.$emit('save', update);
      await flushPromises();

      const expected = {
        ...FullDiveOperator,
        ...update,
      };
      expect(operator.toJSON()).toEqual(expected);
      expect(diveOperators.currentDiveOperator).toEqual(expected);
      expect(saveSpy).toHaveBeenCalled();
      expect(toasts.toasts).toHaveLength(1);
      expect(toasts.toasts[0].id).toBe('dive-operator-saved');
      expect(toasts.toasts[0].type).toBe(ToastType.Success);
    });

    it('will allow an admin to update a dive operator', async () => {
      const operator = new DiveOperator(fetcher, { ...FullDiveOperator });
      const saveSpy = jest.spyOn(operator, 'save').mockResolvedValue();
      jest.spyOn(client.diveOperators, 'wrapDTO').mockReturnValue(operator);

      currentUser.user = { ...AdminUser };
      diveOperators.currentDiveOperator = {
        ...FullDiveOperator,
        owner: ShopOwner.profile,
      };
      await router.push(`/shops/${FullDiveOperator.slug}`);

      const wrapper = mount(DiveOperatorView, opts);
      await flushPromises();

      const editor = wrapper.findComponent(EditDiveOperator);
      expect(editor.isVisible()).toBe(true);
      editor.vm.$emit('save', update);
      await flushPromises();

      const expected = {
        ...FullDiveOperator,
        ...update,
      };
      expect(operator.toJSON()).toEqual(expected);
      expect(diveOperators.currentDiveOperator).toEqual(expected);
      expect(saveSpy).toHaveBeenCalled();
      expect(toasts.toasts).toHaveLength(1);
      expect(toasts.toasts[0].id).toBe('dive-operator-saved');
      expect(toasts.toasts[0].type).toBe(ToastType.Success);
    });

    it('will show an error if there is a slug conflict when saving an existing operator', async () => {
      const operatorData: DiveOperatorDTO = {
        ...FullDiveOperator,
        owner: ShopOwner.profile,
      };
      const operator = new DiveOperator(fetcher, { ...operatorData });
      const saveSpy = jest.spyOn(operator, 'save').mockRejectedValue(
        new HttpException(409, 'Conflict', 'Conflict', {
          message: 'Conflict',
          method: 'PUT',
          path: `/shops/${FullDiveOperator.slug}`,
          status: 409,
        }),
      );
      jest.spyOn(client.diveOperators, 'wrapDTO').mockReturnValue(operator);

      currentUser.user = ShopOwner;
      diveOperators.currentDiveOperator = { ...operatorData };
      await router.push(`/shops/${FullDiveOperator.slug}`);

      const wrapper = mount(DiveOperatorView, opts);
      await flushPromises();

      const editor = wrapper.getComponent(EditDiveOperator);
      expect(editor.isVisible()).toBe(true);
      editor.vm.$emit('save', update);
      await flushPromises();

      const expected = {
        ...operatorData,
        ...update,
      };
      expect(operator.toJSON()).toEqual(expected);
      expect(saveSpy).toHaveBeenCalled();
      expect(toasts.toasts).toHaveLength(1);
      expect(toasts.toasts[0].id).toBe('dive-operator-slug-taken');
      expect(toasts.toasts[0].type).toBe(ToastType.Warning);
      expect(diveOperators.currentDiveOperator).toEqual(operatorData);
    });
  });
});
