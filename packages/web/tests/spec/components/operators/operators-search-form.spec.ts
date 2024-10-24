import {
  AccountTier,
  SearchOperatorsParams,
  UserDTO,
  VerificationStatus,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import OperatorsSearchForm from '../../../../src/components/operators/operators-search-form.vue';
import { useCurrentUser } from '../../../../src/store';
import { AdminUser, BasicUser } from '../../../fixtures/users';

const ShopOwnerUser: UserDTO = {
  ...BasicUser,
  accountTier: AccountTier.ShopOwner,
  profile: {
    ...BasicUser.profile,
    accountTier: AccountTier.ShopOwner,
  },
};

const SearchInput = 'input#operator-search';
const CoordsText = '[data-testid="operator-location-coords"]';
const RadiusSlider = '[data-testid="operator-location-radius"]';
const ShowMyShopsCheckbox = 'input#operator-show-mine';
const ShowInactiveCheckbox = 'input#operator-show-inactive';
const VerificationSelect = 'select#operator-verification-status';
const SearchButton = 'button#btn-operator-search';

describe('OperatorsSearchForm component', () => {
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof OperatorsSearchForm>;

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      props: {
        searchParams: {},
      },
      global: {
        plugins: [pinia],
        stubs: {
          teleport: true,
        },
      },
    };
    currentUser.user = null;
  });

  it('will render with default search options', () => {
    const wrapper = mount(OperatorsSearchForm, opts);
    expect(wrapper.get<HTMLInputElement>(SearchInput).element.value).toBe('');
    expect(
      wrapper.get<HTMLInputElement>(ShowInactiveCheckbox).element.checked,
    ).toBe(false);
    expect(wrapper.find(CoordsText).exists()).toBe(false);
    expect(wrapper.find(RadiusSlider).exists()).toBe(false);
    expect(wrapper.find(ShowMyShopsCheckbox).exists()).toBe(false);
    expect(wrapper.find(VerificationSelect).exists()).toBe(false);
  });

  it('will render with "Only show my shops" checkbox for shop owners', () => {
    currentUser.user = ShopOwnerUser;
    const wrapper = mount(OperatorsSearchForm, opts);
    expect(wrapper.get(ShowMyShopsCheckbox).isVisible()).toBe(true);
  });

  it('will render with search options provided', () => {
    currentUser.user = AdminUser;
    const params: SearchOperatorsParams = {
      owner: AdminUser.username,
      query: 'Cozumel',
      location: {
        lat: 20.42,
        lon: -87.32,
      },
      radius: 250,
      verification: VerificationStatus.Verified,
      showInactive: true,
    };
    const wrapper = mount(OperatorsSearchForm, {
      ...opts,
      props: {
        searchParams: params,
      },
    });
    expect(wrapper.get<HTMLInputElement>(SearchInput).element.value).toBe(
      params.query,
    );
    expect(wrapper.get(CoordsText).text()).toBe(
      `${params.location!.lat}, ${params.location!.lon}`,
    );
    expect(wrapper.get<HTMLInputElement>(RadiusSlider).element.value).toBe(
      params.radius!.toString(),
    );
    expect(
      wrapper.get<HTMLInputElement>(ShowMyShopsCheckbox).element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>(ShowInactiveCheckbox).element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLSelectElement>(VerificationSelect).element.value,
    ).toBe(params.verification);
  });

  [
    { title: 'anonymous users', user: null, expected: false },
    { title: 'free accounts', user: { ...BasicUser }, expected: false },
    {
      title: 'pro accounts',
      user: { ...BasicUser, accountTier: AccountTier.Pro },
      expected: false,
    },
    {
      title: 'shop owners',
      user: { ...BasicUser, accountTier: AccountTier.ShopOwner },
      expected: true,
    },
    { title: 'admin users', user: { ...AdminUser }, expected: true },
  ].forEach(({ title, user, expected }) => {
    it(`will ${
      expected ? 'show' : 'hide'
    } the "Show only my shops" checkbox for ${title}`, () => {
      currentUser.user = user;
      const wrapper = mount(OperatorsSearchForm, opts);

      if (expected) {
        expect(wrapper.get(ShowMyShopsCheckbox).isVisible()).toBe(true);
      } else {
        expect(wrapper.find(ShowMyShopsCheckbox).exists()).toBe(false);
      }
    });
  });

  it('will emit "search" event when form is submitted', async () => {
    currentUser.user = ShopOwnerUser;
    const wrapper = mount(OperatorsSearchForm, opts);
    await wrapper.get(SearchInput).setValue('Cozumel');
    await wrapper
      .get('[data-testid="operator-location-select-btn"]')
      .trigger('click');
    await wrapper.get('input#latitude').setValue('20.42');
    await wrapper.get('input#longitude').setValue('-87.32');
    await wrapper.get('[data-testid="confirm-location"]').trigger('click');
    await flushPromises();
    await wrapper.get(RadiusSlider).setValue('170');
    await wrapper.get(ShowMyShopsCheckbox).setValue(true);
    await wrapper.get(ShowInactiveCheckbox).setValue(true);
    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('search')).toEqual([
      [
        {
          query: 'Cozumel',
          location: { lat: 20.42, lon: -87.32 },
          radius: 170,
          owner: ShopOwnerUser.username,
          showInactive: true,
        },
      ],
    ]);
  });

  it('will allow admins to search by verified status', async () => {
    currentUser.user = AdminUser;
    const wrapper = mount(OperatorsSearchForm, opts);
    await wrapper.get(VerificationSelect).setValue(VerificationStatus.Verified);
    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('search')).toEqual([
      [
        {
          verification: VerificationStatus.Verified,
        },
      ],
    ]);
  });
});
