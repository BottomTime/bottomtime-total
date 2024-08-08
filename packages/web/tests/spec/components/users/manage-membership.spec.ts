import { AccountTier, ApiClient, Fetcher, User } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import ManageMembership from '../../../../src/components/users/manage-membership.vue';
import { useToasts } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

const AccountTierLabel = '[data-testid="account-tier-value"]';
const ChangeMembershipButton = '#change-account-type';
const BasicMembershipRadio = '#account-tier-basic';
const ProMembershipRadio = '#account-tier-pro';
const ShopOwnerMembershipRadio = '#account-tier-shop-owner';
const ConfirmMembershipButton = '#confirm-account-change';
const CancelMembershipButton = '#cancel-account-change';

describe('ManageMembership component', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof ManageMembership>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient();
    router = createRouter([
      {
        path: '/shops/:username',
        component: ManageMembership,
      },
    ]);
  });

  beforeEach(() => {
    pinia = createPinia();
    toasts = useToasts(pinia);
    opts = {
      props: {
        user: { ...BasicUser },
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will render for a basic account', () => {
    opts.props!.user.accountTier = AccountTier.Basic;
    const wrapper = mount(ManageMembership, opts);
    expect(wrapper.get(AccountTierLabel).text()).toMatchSnapshot();
  });

  it('will render for a pro account', () => {
    opts.props!.user.accountTier = AccountTier.Pro;
    const wrapper = mount(ManageMembership, opts);
    expect(wrapper.get(AccountTierLabel).text()).toMatchSnapshot();
  });

  it('will render for a shop owner account', () => {
    opts.props!.user.accountTier = AccountTier.ShopOwner;
    const wrapper = mount(ManageMembership, opts);
    expect(wrapper.get(AccountTierLabel).text()).toMatchSnapshot();
  });

  it('will allow a user to change their membership', async () => {
    const user = new User(fetcher, { ...BasicUser });
    const spy = jest.spyOn(user, 'changeMembership').mockResolvedValue();
    const wrapper = mount(ManageMembership, opts);
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(user);

    await wrapper.get(ChangeMembershipButton).trigger('click');
    await wrapper.get(ProMembershipRadio).setValue(true);
    await wrapper.get(ConfirmMembershipButton).trigger('click');
    await flushPromises();

    expect(toasts.toasts).toMatchSnapshot();
    expect(spy).toHaveBeenCalledWith(AccountTier.Pro);
    expect(wrapper.emitted('account-type-changed')).toEqual([
      [AccountTier.Pro],
    ]);
    expect(wrapper.find(ConfirmMembershipButton).exists()).toBe(false);
  });

  it('will allow a user to cancel changing their membership', async () => {
    const wrapper = mount(ManageMembership, opts);
    const spy = jest.spyOn(client.users, 'wrapDTO');
    await wrapper.get(ChangeMembershipButton).trigger('click');
    await wrapper.get(ShopOwnerMembershipRadio).setValue(true);
    await wrapper.get(CancelMembershipButton).trigger('click');
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
    expect(wrapper.emitted('account-type-changed')).toBeUndefined();
    expect(wrapper.find(ConfirmMembershipButton).exists()).toBe(false);

    await wrapper.get(ChangeMembershipButton).trigger('click');
    expect(
      wrapper.get<HTMLInputElement>(BasicMembershipRadio).element.checked,
    ).toBe(true);
  });
});
