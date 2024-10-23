import { AccountTier, SearchOperatorsParams } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import OperatorsSearchForm from '../../../../src/components/operators/operators-search-form.vue';
import { useCurrentUser } from '../../../../src/store';
import { AdminUser, BasicUser } from '../../../fixtures/users';

const SearchInput = 'input#operator-search';
const CoordsText = '[data-testid="operator-location-coords"]';
const RadiusSlider = '[data-testid="operator-location-radius"]';
const ShowMyShopsCheckbox = 'input#operator-show-mine';
const ShowInactiveCheckbox = 'input#operator-show-inactive';
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

    currentUser.user = { ...BasicUser, accountTier: AccountTier.ShopOwner };
  });

  it('will render with default search options', () => {
    const wrapper = mount(OperatorsSearchForm, opts);
    expect(wrapper.get<HTMLInputElement>(SearchInput).element.value).toBe('');
    expect(wrapper.find(CoordsText).exists()).toBe(false);
    expect(wrapper.find(RadiusSlider).exists()).toBe(false);
    expect(
      wrapper.get<HTMLInputElement>(ShowMyShopsCheckbox).element.checked,
    ).toBe(false);
  });

  it('will render with search options provided', () => {
    const params: SearchOperatorsParams = {
      owner: BasicUser.username,
      query: 'Cozumel',
      location: {
        lat: 20.42,
        lon: -87.32,
      },
      radius: 250,
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
          owner: BasicUser.username,
          showInactive: true,
        },
      ],
    ]);
  });
});
