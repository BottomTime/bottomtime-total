import {
  AccountTier,
  ApiClient,
  BillingFrequency,
  ListMembershipsResponseDTO,
  MembershipStatus,
  MembershipStatusDTO,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../../src/api-client';
import ManageMembership from '../../../../../src/components/users/membership/manage-membership.vue';
import { createRouter } from '../../../../fixtures/create-router';
import { BasicUser } from '../../../../fixtures/users';

const MembershipOptions: ListMembershipsResponseDTO = [
  {
    accountTier: AccountTier.Basic,
    currency: 'CAD',
    frequency: BillingFrequency.Month,
    price: 0,
    name: 'Free Tier',
    description: 'This is the free tier',
    marketingFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
  },
  {
    accountTier: AccountTier.Pro,
    currency: 'CAD',
    frequency: BillingFrequency.Year,
    price: 99.99,
    name: 'Pro Tier',
    description: 'This is the pro tier',
    marketingFeatures: ['Feature 4', 'Feature 5', 'Feature 6'],
  },
  {
    accountTier: AccountTier.ShopOwner,
    currency: 'CAD',
    frequency: BillingFrequency.Month,
    price: 49.99,
    name: 'Shop Owner Tier',
    description: 'This is the shop owner tier',
    marketingFeatures: ['Feature 7', 'Feature 8', 'Feature 9'],
  },
];

const NoMembership: MembershipStatusDTO = {
  accountTier: AccountTier.Basic,
  entitlements: [],
  status: MembershipStatus.None,
};

const ProMembership: MembershipStatusDTO = {
  accountTier: AccountTier.Pro,
  entitlements: ['pro'],
  status: MembershipStatus.Active,
  nextBillingDate: new Date('2025-06-07'),
};

const ShopOwnerMembership: MembershipStatusDTO = {
  accountTier: AccountTier.ShopOwner,
  entitlements: ['pro', 'shop-owner'],
  status: MembershipStatus.Active,
  nextBillingDate: new Date('2025-06-07'),
};

const ChangeMembershipButton = 'button#change-account-type';
const ConfirmButton = 'button#confirm-account-change';
const CancelButton = 'button#cancel-account-change';

function accountTierRadio(tier: AccountTier) {
  return `[data-testid="account-tier-${tier}"]`;
}

describe('ManageMembership component', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof ManageMembership>;

  beforeAll(() => {
    router = createRouter([
      {
        path: '/account',
        component: { template: '' },
      },
      {
        path: '/membership/confirmation',
        component: { template: '' },
      },
      {
        path: '/membership/canceled',
        component: { template: '' },
      },
    ]);
    client = new ApiClient();
  });

  beforeEach(async () => {
    await router.push('/account');
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          teleport: true,
        },
      },
      props: {
        user: { ...BasicUser },
      },
    };

    jest
      .spyOn(client.memberships, 'listMemberships')
      .mockResolvedValue(MembershipOptions);
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(NoMembership);
  });

  it('will render an error message if membership options cannot be loaded', async () => {
    jest.resetAllMocks();
    jest
      .spyOn(client.memberships, 'listMemberships')
      .mockRejectedValue(new Error('nope'));

    const wrapper = mount(ManageMembership, opts);
    await flushPromises();

    expect(wrapper.get('[data-testid="membership-error"]').isVisible()).toBe(
      true,
    );
  });

  it('will render an error message if user membership status cannot be queried', async () => {
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockRejectedValue(new Error('nope'));

    const wrapper = mount(ManageMembership, opts);
    await flushPromises();

    expect(wrapper.get('[data-testid="membership-error"]').isVisible()).toBe(
      true,
    );
  });

  it('will allow a user to cancel out of the membership form', async () => {
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(NoMembership);

    const wrapper = mount(ManageMembership, opts);
    await flushPromises();

    await wrapper.get(ChangeMembershipButton).trigger('click');
    await wrapper.get(accountTierRadio(AccountTier.Pro)).setValue(true);
    await wrapper.get(CancelButton).trigger('click');

    expect(wrapper.find(accountTierRadio(AccountTier.Pro)).exists()).toBe(
      false,
    );
  });

  it('will allow a user to create a new membership and redirect them to the payment page', async () => {
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(NoMembership);
    const spy = jest
      .spyOn(client.memberships, 'updateMembership')
      .mockResolvedValue(ProMembership);

    const wrapper = mount(ManageMembership, opts);
    await flushPromises();

    await wrapper.get(ChangeMembershipButton).trigger('click');
    await wrapper.get(accountTierRadio(AccountTier.Pro)).setValue(true);
    await wrapper.get(ConfirmButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(BasicUser.username, AccountTier.Pro);
    expect(router.currentRoute.value.path).toBe('/membership/confirmation');
  });

  it('will allow a user to alter an existing membership', async () => {
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(ProMembership);
    const spy = jest
      .spyOn(client.memberships, 'updateMembership')
      .mockResolvedValue(ShopOwnerMembership);

    const wrapper = mount(ManageMembership, opts);
    await flushPromises();

    await wrapper.get(ChangeMembershipButton).trigger('click');
    await wrapper.get(accountTierRadio(AccountTier.ShopOwner)).setValue(true);
    await wrapper.get(ConfirmButton).trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(BasicUser.username, AccountTier.ShopOwner);
    expect(router.currentRoute.value.path).toBe('/membership/confirmation');
  });

  it('will allow a user to change their mind about altering an existing membership', async () => {
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(ProMembership);
    const spy = jest
      .spyOn(client.memberships, 'updateMembership')
      .mockResolvedValue(ShopOwnerMembership);

    const wrapper = mount(ManageMembership, opts);
    await flushPromises();

    await wrapper.get(ChangeMembershipButton).trigger('click');
    await wrapper.get(accountTierRadio(AccountTier.ShopOwner)).setValue(true);
    await wrapper.get(ConfirmButton).trigger('click');
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/account');
  });

  it('will allow a user to cancel a membership', async () => {
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(ProMembership);
    const spy = jest
      .spyOn(client.memberships, 'cancelMembership')
      .mockResolvedValue();

    const wrapper = mount(ManageMembership, opts);
    await flushPromises();

    await wrapper.get(ChangeMembershipButton).trigger('click');
    await wrapper.get(accountTierRadio(AccountTier.Basic)).setValue(true);
    await wrapper.get(ConfirmButton).trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(BasicUser.username);
    expect(router.currentRoute.value.path).toBe('/membership/canceled');
  });

  it('will allow a user to change their mind about canceling a membership', async () => {
    jest
      .spyOn(client.memberships, 'getMembershipStatus')
      .mockResolvedValue(ProMembership);
    const spy = jest
      .spyOn(client.memberships, 'cancelMembership')
      .mockResolvedValue();

    const wrapper = mount(ManageMembership, opts);
    await flushPromises();

    await wrapper.get(ChangeMembershipButton).trigger('click');
    await wrapper.get(accountTierRadio(AccountTier.Basic)).setValue(true);
    await wrapper.get(ConfirmButton).trigger('click');
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/account');
  });
});
