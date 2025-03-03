import {
  AccountTier,
  ApiClient,
  CreateOrUpdateOperatorDTO,
  Fetcher,
  OperatorDTO,
  UserDTO,
  VerificationStatus,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import { ToastType } from '../../../../src/common';
import EditOperator from '../../../../src/components/operators/edit-operator.vue';
import ViewOperator from '../../../../src/components/operators/view-operator.vue';
import { FeaturesServiceKey } from '../../../../src/featrues';
import { useCurrentUser, useToasts } from '../../../../src/store';
import OperatorView from '../../../../src/views/operators/operator-view.vue';
import { ConfigCatClientMock } from '../../../config-cat-client-mock';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import { FullOperator } from '../../../fixtures/operators';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../../fixtures/users';

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
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof OperatorView>;
  let fetchSpy: jest.SpyInstance;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    features = new ConfigCatClientMock();
    router = createRouter([
      {
        path: '/shops',
        component: { template: '' },
      },
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

  beforeEach(async () => {
    jest.useFakeTimers({
      doNotFake: ['setImmediate', 'nextTick'],
    });
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    toasts = useToasts(pinia);
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

    fetchSpy = jest
      .spyOn(client.operators, 'getOperator')
      .mockResolvedValue({ ...FullOperator, owner: ShopOwner.profile });
    await router.push(`/shops/${FullOperator.slug}`);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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

  it('will allow user to view a dive operator in read-only mode', async () => {
    currentUser.user = UserWithFullProfile;
    const wrapper = mount(OperatorView, opts);
    await flushPromises();

    const viewer = wrapper.getComponent(ViewOperator);
    expect(viewer.isVisible()).toBe(true);
    expect(viewer.props('operator')).toEqual({
      ...FullOperator,
      owner: ShopOwner.profile,
    });
    expect(fetchSpy).toHaveBeenCalledWith(FullOperator.slug);
  });

  it('will show not found if operator is not found', async () => {
    jest
      .spyOn(client.operators, 'getOperator')
      .mockRejectedValue(createHttpError(404));

    const wrapper = mount(OperatorView, opts);
    await flushPromises();

    expect(wrapper.find('[data-testid="not-found-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.findComponent(ViewOperator).exists()).toBe(false);
  });

  it('will show login form if unauthenticated user tries to create a new operator', async () => {
    currentUser.user = null;
    await router.push('/shops/createNew');

    const wrapper = mount(OperatorView, opts);
    await flushPromises();

    expect(
      wrapper.get('[data-testid="require-auth-anonymous"]').isVisible(),
    ).toBe(true);
    expect(wrapper.findComponent(EditOperator).exists()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('will show forbidden message when a regular user tries to create a new operator', async () => {
    currentUser.user = {
      ...BasicUser,
      accountTier: AccountTier.Basic,
    };
    await router.push('/shops/createNew');

    const wrapper = mount(OperatorView, opts);
    await flushPromises();

    expect(wrapper.find('[data-testid="forbidden-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.findComponent(EditOperator).exists()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('will show forbidden message when a pro user tries to create a new operator', async () => {
    currentUser.user = {
      ...BasicUser,
      accountTier: AccountTier.Pro,
    };
    await router.push('/shops/createNew');

    const wrapper = mount(OperatorView, opts);
    await flushPromises();

    expect(wrapper.find('[data-testid="forbidden-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.findComponent(EditOperator).exists()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('will allow a shop owner to create a new dive operator', async () => {
    const expected: OperatorDTO = {
      id: '31a6723a-88de-460c-af33-b2363b7aec47',
      createdAt: new Date('2024-01-10T10:54:08.909Z').valueOf(),
      updatedAt: new Date('2024-10-09T18:44:28.447Z').valueOf(),
      owner: ShopOwner.profile,
      verificationStatus: VerificationStatus.Unverified,
      ...create,
    };
    const spy = jest
      .spyOn(client.operators, 'createOperator')
      .mockResolvedValue(expected);

    currentUser.user = ShopOwner;
    await router.push('/shops/createNew');

    const wrapper = mount(OperatorView, opts);
    await flushPromises();

    wrapper.getComponent(EditOperator).vm.$emit('save', create);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(create);
    expect(router.currentRoute.value.path).toBe(`/shops/${expected.slug}`);
  });

  it('will allow an admin to create a new dive operator', async () => {
    const expected: OperatorDTO = {
      id: '31a6723a-88de-460c-af33-b2363b7aec47',
      createdAt: new Date('2024-01-10T10:54:08.909Z').valueOf(),
      updatedAt: new Date('2024-10-09T18:44:28.447Z').valueOf(),
      owner: AdminUser.profile,
      verificationStatus: VerificationStatus.Unverified,
      ...create,
    };
    const spy = jest
      .spyOn(client.operators, 'createOperator')
      .mockResolvedValue(expected);

    currentUser.user = AdminUser;
    await router.push('/shops/createNew');

    const wrapper = mount(OperatorView, opts);
    await flushPromises();

    wrapper.getComponent(EditOperator).vm.$emit('save', create);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(create);
    expect(router.currentRoute.value.path).toBe(`/shops/${expected.slug}`);
  });

  it('will show an error if there is a slug conflict when saving a new operator', async () => {
    const spy = jest
      .spyOn(client.operators, 'createOperator')
      .mockRejectedValue(createHttpError(409));

    currentUser.user = ShopOwner;
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
  });

  it('will allow a shop owner to update a dive operator', async () => {
    const expected = {
      ...FullOperator,
      ...update,
    };
    const saveSpy = jest
      .spyOn(client.operators, 'updateOperator')
      .mockResolvedValue(expected);

    currentUser.user = ShopOwner;
    await router.push(`/shops/${FullOperator.slug}`);

    const wrapper = mount(OperatorView, opts);
    await flushPromises();

    const editor = wrapper.getComponent(EditOperator);
    expect(editor.isVisible()).toBe(true);
    editor.vm.$emit('save', update);
    await flushPromises();

    expect(saveSpy).toHaveBeenCalledWith(FullOperator.slug, update);
  });

  it('will allow an admin to update a dive operator', async () => {
    const expected = {
      ...FullOperator,
      ...update,
    };
    const saveSpy = jest
      .spyOn(client.operators, 'updateOperator')
      .mockResolvedValue(expected);

    currentUser.user = { ...AdminUser };
    await router.push(`/shops/${FullOperator.slug}`);

    const wrapper = mount(OperatorView, opts);
    await flushPromises();

    const editor = wrapper.findComponent(EditOperator);
    expect(editor.isVisible()).toBe(true);
    editor.vm.$emit('save', update);
    await flushPromises();

    expect(saveSpy).toHaveBeenCalledWith(FullOperator.slug, update);
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].id).toBe('dive-operator-saved');
    expect(toasts.toasts[0].type).toBe(ToastType.Success);
  });

  it('will show an error if there is a slug conflict when saving an existing operator', async () => {
    const saveSpy = jest
      .spyOn(client.operators, 'updateOperator')
      .mockRejectedValue(createHttpError(409));

    currentUser.user = ShopOwner;
    await router.push(`/shops/${FullOperator.slug}`);

    const wrapper = mount(OperatorView, opts);
    await flushPromises();

    const editor = wrapper.getComponent(EditOperator);
    expect(editor.isVisible()).toBe(true);
    editor.vm.$emit('save', update);
    await flushPromises();

    expect(saveSpy).toHaveBeenCalled();
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].id).toBe('dive-operator-slug-taken');
    expect(toasts.toasts[0].type).toBe(ToastType.Warning);
  });

  it('will allow a user to delete a dive operator', async () => {
    // const operatorData: OperatorDTO = {
    //   ...FullOperator,
    //   owner: ShopOwner.profile,
    // };
    const deleteSpy = jest
      .spyOn(client.operators, 'deleteOperator')
      .mockResolvedValue();

    currentUser.user = ShopOwner;
    await router.push(`/shops/${FullOperator.slug}`);

    const wrapper = mount(OperatorView, opts);
    await flushPromises();

    await wrapper.get('[data-testid="btn-delete-operator"]').trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(deleteSpy).toHaveBeenCalledWith(FullOperator.slug);
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].id).toBe('dive-operator-deleted');
    expect(toasts.toasts[0].type).toBe(ToastType.Success);

    jest.runAllTimers();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/shops');
  });
});
