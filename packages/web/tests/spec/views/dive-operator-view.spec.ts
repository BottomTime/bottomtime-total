import {
  AccountTier,
  ApiClient,
  CreateOrUpdateDiveOperatorDTO,
  DiveOperator,
  DiveOperatorDTO,
  Fetcher,
  HttpException,
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
import EditDiveOperator from '../../../src/components/operators/edit-dive-operator.vue';
import ViewDiveOperator from '../../../src/components/operators/view-dive-operator.vue';
import { FeaturesServiceKey } from '../../../src/featrues';
import {
  useCurrentUser,
  useDiveOperators,
  useToasts,
} from '../../../src/store';
import DiveOperatorView from '../../../src/views/dive-operator-view.vue';
import { ConfigCatClientMock } from '../../config-cat-client-mock';
import { createRouter } from '../../fixtures/create-router';
import {
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
    router = createRouter([
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

    it('will allow user to view a dive operator', async () => {
      diveOperators.currentDiveOperator = { ...PartialDiveOperator };
      await router.push(`/shops/${PartialDiveOperator.slug}`);

      const wrapper = await mount(DiveOperatorView, opts);
      await flushPromises();

      const viewer = wrapper.getComponent(ViewDiveOperator);
      expect(viewer.isVisible()).toBe(true);
      expect(viewer.props('operator')).toEqual(PartialDiveOperator);
    });

    it('will show not found if operator is not found', async () => {
      diveOperators.currentDiveOperator = null;
      await router.push('/shops/unknown-operator');

      const wrapper = await mount(DiveOperatorView, opts);
      await flushPromises();

      expect(
        wrapper.find('[data-testid="not-found-message"]').isVisible(),
      ).toBe(true);
      expect(wrapper.findComponent(ViewDiveOperator).exists()).toBe(false);
    });

    it.skip('will allow a shop owner to create a new dive operator', async () => {
      currentUser.user = ShopOwner;
      diveOperators.currentDiveOperator = null;
      await router.push('/shops/createNew');

      const wrapper = await mount(DiveOperatorView, opts);
      await flushPromises();

      const viewer = wrapper.getComponent(ViewDiveOperator);
      expect(viewer.isVisible()).toBe(true);
      expect(viewer.props('operator')).toBeNull();
    });

    it.skip('will allow an admin to create a new dive operator', async () => {});

    it.skip('will show an error if there is a slug conflict when saving a new operator', () => {});

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

      const wrapper = await mount(DiveOperatorView, opts);
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

      const wrapper = await mount(DiveOperatorView, opts);
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

      const wrapper = await mount(DiveOperatorView, opts);
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
