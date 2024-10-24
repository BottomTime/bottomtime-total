import {
  AccountTier,
  ApiClient,
  CreateOrUpdateOperatorDTO,
  Fetcher,
  HttpException,
  Operator,
  OperatorDTO,
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
import EditOperator from '../../../src/components/operators/edit-operator.vue';
import ViewOperator from '../../../src/components/operators/view-operator.vue';
import { FeaturesServiceKey } from '../../../src/featrues';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser, useOperators, useToasts } from '../../../src/store';
import OperatorView from '../../../src/views/operator-view.vue';
import { ConfigCatClientMock } from '../../config-cat-client-mock';
import { createRouter } from '../../fixtures/create-router';
import {
  BlankOperator,
  FullOperator,
  PartialOperator,
} from '../../fixtures/operators';
import { AdminUser, BasicUser } from '../../fixtures/users';

const ShopOwner: UserDTO = {
  ...BasicUser,
  accountTier: AccountTier.ShopOwner,
  profile: {
    ...BasicUser.profile,
    accountTier: AccountTier.ShopOwner,
  },
};

describe('Operator view', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let features: ConfigCatClientMock;
  let location: MockLocation;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let operators: ReturnType<typeof useOperators>;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof OperatorView>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    features = new ConfigCatClientMock();
    router = createRouter([
      {
        path: '/shops/createNew',
        component: OperatorView,
      },
      {
        path: '/shops/:shopKey',
        component: OperatorView,
      },
    ]);
  });

  beforeEach(() => {
    jest.useFakeTimers({
      doNotFake: ['setImmediate', 'nextTick'],
    });
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    operators = useOperators(pinia);
    toasts = useToasts(pinia);
    features.flags[ManageDiveOperatorsFeature.key] = true;
    location = new MockLocation();
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

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when rendering on the server side', () => {
    it('will render not found page if feature flag is off', async () => {
      features.flags[ManageDiveOperatorsFeature.key] = false;

      const div = document.createElement('div');
      div.innerHTML = await renderToString(OperatorView, {
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

      const spy = jest.spyOn(client.operators, 'getOperator').mockRejectedValue(
        new HttpException(404, 'Not found', 'Not found', {
          message: 'Not found',
          method: 'GET',
          path: '/dive-operators/unknown-operator',
          status: 404,
        }),
      );

      const div = document.createElement('div');
      div.innerHTML = await renderToString(OperatorView, {
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
      await router.push(`/shops/${FullOperator.slug}`);

      const spy = jest
        .spyOn(client.operators, 'getOperator')
        .mockResolvedValue(new Operator(fetcher, FullOperator));

      const div = document.createElement('div');
      div.innerHTML = await renderToString(OperatorView, {
        global: opts.global,
      });

      expect(spy).toHaveBeenCalledWith(FullOperator.slug);

      const html = div.querySelector('[data-testid="view-operator-section"]');
      expect(html).not.toBeNull();
      expect(html?.innerHTML).toMatchSnapshot();
    });

    it('will render in edit mode when the user is the shop owner', async () => {
      const operator: OperatorDTO = {
        ...FullOperator,
        owner: ShopOwner.profile,
      };
      currentUser.user = ShopOwner;
      await router.push(`/shops/${operator.slug}`);

      const spy = jest
        .spyOn(client.operators, 'getOperator')
        .mockResolvedValue(new Operator(fetcher, operator));

      const div = document.createElement('div');
      div.innerHTML = await renderToString(OperatorView, {
        global: opts.global,
      });

      expect(
        div.querySelector<HTMLInputElement>('input#operator-name')?.value,
      ).toBe(operator.name);
      expect(spy).toHaveBeenCalledWith(operator.slug);
    });
  });

  describe('when rendering on client side', () => {
    const update: CreateOrUpdateOperatorDTO = {
      active: true,
      address: '1234 Main St',
      description: 'A new dive shop',
      name: 'New Shop',
      phone: '555-555-5555',
      slug: FullOperator.slug,
      email: FullOperator.email,
      gps: FullOperator.gps,
      socials: FullOperator.socials,
      website: FullOperator.website,
    };

    const create: CreateOrUpdateOperatorDTO = {
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
      operators.currentOperator = { ...PartialOperator };
      await router.push(`/shops/${PartialOperator.slug}`);

      const wrapper = mount(OperatorView, opts);
      await flushPromises();

      const viewer = wrapper.getComponent(ViewOperator);
      expect(viewer.isVisible()).toBe(true);
      expect(viewer.props('operator')).toEqual(PartialOperator);
    });

    it('will show not found if operator is not found', async () => {
      operators.currentOperator = null;
      await router.push('/shops/unknown-operator');

      const wrapper = mount(OperatorView, opts);
      await flushPromises();

      expect(
        wrapper.find('[data-testid="not-found-message"]').isVisible(),
      ).toBe(true);
      expect(wrapper.findComponent(ViewOperator).exists()).toBe(false);
    });

    it('will show login form if unauthenticated user tries to create a new operator', async () => {
      currentUser.user = null;
      operators.currentOperator = {
        ...BlankOperator,
        owner: ShopOwner.profile,
      };
      await router.push('/shops/createNew');

      const wrapper = mount(OperatorView, opts);
      await flushPromises();

      expect(
        wrapper.get('[data-testid="require-auth-anonymous"]').isVisible(),
      ).toBe(true);
      expect(wrapper.findComponent(EditOperator).exists()).toBe(false);
    });

    it('will show forbidden message when a regular user tries to create a new operator', async () => {
      currentUser.user = {
        ...BasicUser,
        accountTier: AccountTier.Basic,
      };
      operators.currentOperator = {
        ...BlankOperator,
        owner: BasicUser.profile,
      };

      const wrapper = mount(OperatorView, opts);
      await flushPromises();

      expect(
        wrapper.find('[data-testid="forbidden-message"]').isVisible(),
      ).toBe(true);
      expect(wrapper.findComponent(EditOperator).exists()).toBe(false);
    });

    it('will show forbidden message when a pro user tries to create a new operator', async () => {
      currentUser.user = {
        ...BasicUser,
        accountTier: AccountTier.Pro,
      };
      operators.currentOperator = {
        ...BlankOperator,
        owner: BasicUser.profile,
      };

      const wrapper = mount(OperatorView, opts);
      await flushPromises();

      expect(
        wrapper.find('[data-testid="forbidden-message"]').isVisible(),
      ).toBe(true);
      expect(wrapper.findComponent(EditOperator).exists()).toBe(false);
    });

    it('will allow a shop owner to create a new dive operator', async () => {
      const expected: OperatorDTO = {
        id: '31a6723a-88de-460c-af33-b2363b7aec47',
        createdAt: new Date('2024-01-10T10:54:08.909Z'),
        updatedAt: new Date('2024-10-09T18:44:28.447Z'),
        owner: ShopOwner.profile,
        verificationStatus: VerificationStatus.Unverified,
        ...create,
      };
      const spy = jest
        .spyOn(client.operators, 'createOperator')
        .mockResolvedValue(new Operator(fetcher, expected));

      currentUser.user = ShopOwner;
      operators.currentOperator = {
        ...BlankOperator,
        owner: ShopOwner.profile,
      };
      await router.push('/shops/createNew');

      const wrapper = mount(OperatorView, opts);
      await flushPromises();

      wrapper.getComponent(EditOperator).vm.$emit('save', create);
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(create);
      expect(router.currentRoute.value.path).toBe(`/shops/${expected.slug}`);
      expect(operators.currentOperator).toEqual(expected);
    });

    it('will allow an admin to create a new dive operator', async () => {
      const expected: OperatorDTO = {
        id: '31a6723a-88de-460c-af33-b2363b7aec47',
        createdAt: new Date('2024-01-10T10:54:08.909Z'),
        updatedAt: new Date('2024-10-09T18:44:28.447Z'),
        owner: AdminUser.profile,
        verificationStatus: VerificationStatus.Unverified,
        ...create,
      };
      const spy = jest
        .spyOn(client.operators, 'createOperator')
        .mockResolvedValue(new Operator(fetcher, expected));

      currentUser.user = AdminUser;
      operators.currentOperator = {
        ...BlankOperator,
        owner: AdminUser.profile,
      };
      await router.push('/shops/createNew');

      const wrapper = mount(OperatorView, opts);
      await flushPromises();

      wrapper.getComponent(EditOperator).vm.$emit('save', create);
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(create);
      expect(router.currentRoute.value.path).toBe(`/shops/${expected.slug}`);
      expect(operators.currentOperator).toEqual(expected);
    });

    it('will show an error if there is a slug conflict when saving a new operator', async () => {
      const spy = jest
        .spyOn(client.operators, 'createOperator')
        .mockRejectedValue(
          new HttpException(409, 'Conflict', 'Conflict', {
            message: 'Conflict',
            method: 'POST',
            path: '/shops/createNew',
            status: 409,
          }),
        );

      currentUser.user = ShopOwner;
      operators.currentOperator = {
        ...BlankOperator,
        owner: ShopOwner.profile,
      };
      await router.push('/shops/createNew');

      const wrapper = mount(OperatorView, opts);
      await flushPromises();

      wrapper.getComponent(EditOperator).vm.$emit('save', create);
      await flushPromises();

      expect(toasts.toasts).toHaveLength(1);
      expect(toasts.toasts[0].id).toBe('dive-operator-slug-taken');
      expect(toasts.toasts[0].type).toBe(ToastType.Warning);

      expect(spy).toHaveBeenCalledWith(create);
      expect(router.currentRoute.value.path).toBe('/shops/createNew');
      expect(operators.currentOperator).toEqual({
        ...BlankOperator,
        owner: ShopOwner.profile,
      });
    });

    it('will allow a shop owner to update a dive operator', async () => {
      const operator = new Operator(fetcher, { ...FullOperator });
      const saveSpy = jest.spyOn(operator, 'save').mockResolvedValue();
      jest.spyOn(client.operators, 'wrapDTO').mockReturnValue(operator);

      currentUser.user = ShopOwner;
      operators.currentOperator = {
        ...FullOperator,
        owner: ShopOwner.profile,
      };
      await router.push(`/shops/${FullOperator.slug}`);

      const wrapper = mount(OperatorView, opts);
      await flushPromises();

      const editor = wrapper.getComponent(EditOperator);
      expect(editor.isVisible()).toBe(true);
      editor.vm.$emit('save', update);
      await flushPromises();

      const expected = {
        ...FullOperator,
        ...update,
      };
      expect(operator.toJSON()).toEqual(expected);
      expect(operators.currentOperator).toEqual(expected);
      expect(saveSpy).toHaveBeenCalled();
      expect(toasts.toasts).toHaveLength(1);
      expect(toasts.toasts[0].id).toBe('dive-operator-saved');
      expect(toasts.toasts[0].type).toBe(ToastType.Success);
    });

    it('will allow an admin to update a dive operator', async () => {
      const operator = new Operator(fetcher, { ...FullOperator });
      const saveSpy = jest.spyOn(operator, 'save').mockResolvedValue();
      jest.spyOn(client.operators, 'wrapDTO').mockReturnValue(operator);

      currentUser.user = { ...AdminUser };
      operators.currentOperator = {
        ...FullOperator,
        owner: ShopOwner.profile,
      };
      await router.push(`/shops/${FullOperator.slug}`);

      const wrapper = mount(OperatorView, opts);
      await flushPromises();

      const editor = wrapper.findComponent(EditOperator);
      expect(editor.isVisible()).toBe(true);
      editor.vm.$emit('save', update);
      await flushPromises();

      const expected = {
        ...FullOperator,
        ...update,
      };
      expect(operator.toJSON()).toEqual(expected);
      expect(operators.currentOperator).toEqual(expected);
      expect(saveSpy).toHaveBeenCalled();
      expect(toasts.toasts).toHaveLength(1);
      expect(toasts.toasts[0].id).toBe('dive-operator-saved');
      expect(toasts.toasts[0].type).toBe(ToastType.Success);
    });

    it('will show an error if there is a slug conflict when saving an existing operator', async () => {
      const operatorData: OperatorDTO = {
        ...FullOperator,
        owner: ShopOwner.profile,
      };
      const operator = new Operator(fetcher, { ...operatorData });
      const saveSpy = jest.spyOn(operator, 'save').mockRejectedValue(
        new HttpException(409, 'Conflict', 'Conflict', {
          message: 'Conflict',
          method: 'PUT',
          path: `/shops/${FullOperator.slug}`,
          status: 409,
        }),
      );
      jest.spyOn(client.operators, 'wrapDTO').mockReturnValue(operator);

      currentUser.user = ShopOwner;
      operators.currentOperator = { ...operatorData };
      await router.push(`/shops/${FullOperator.slug}`);

      const wrapper = mount(OperatorView, opts);
      await flushPromises();

      const editor = wrapper.getComponent(EditOperator);
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
      expect(operators.currentOperator).toEqual(operatorData);
    });

    it('will allow a user to delete a dive operator', async () => {
      const operatorData: OperatorDTO = {
        ...FullOperator,
        owner: ShopOwner.profile,
      };
      const operator = new Operator(fetcher, operatorData);
      const deleteSpy = jest.spyOn(operator, 'delete').mockResolvedValue();
      jest.spyOn(client.operators, 'wrapDTO').mockReturnValue(operator);

      currentUser.user = ShopOwner;
      operators.currentOperator = operatorData;
      await router.push(`/shops/${FullOperator.slug}`);

      const wrapper = mount(OperatorView, opts);
      await flushPromises();

      await wrapper.get('[data-testid="btn-delete-operator"]').trigger('click');
      await wrapper
        .get('[data-testid="dialog-confirm-button"]')
        .trigger('click');
      await flushPromises();

      expect(deleteSpy).toHaveBeenCalled();
      expect(toasts.toasts).toHaveLength(1);
      expect(toasts.toasts[0].id).toBe('dive-operator-deleted');
      expect(toasts.toasts[0].type).toBe(ToastType.Success);

      jest.runAllTimers();
      await flushPromises();
      expect(location.pathname).toBe('/shops');
    });
  });
});
