import {
  AccountTier,
  BillingFrequency,
  ListMembershipsResponseDTO,
} from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import MembershipForm from '../../../../../src/components/users/membership/membership-form.vue';

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

const ConfirmButton = 'button#confirm-account-change';
const CancelButton = 'button#cancel-account-change';

function accountTierRadio(tier: AccountTier) {
  return `[data-testid="account-tier-${tier}"]`;
}

describe('MembershipForm component', () => {
  let opts: ComponentMountingOptions<typeof MembershipForm>;

  beforeEach(() => {
    opts = {
      props: {
        accountTier: AccountTier.Basic,
        options: [...MembershipOptions],
      },
    };
  });

  it('will render the membership options', () => {
    const wrapper = mount(MembershipForm, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will not enable the confirm button if the selected membership is the same as the current membership', () => {
    const wrapper = mount(MembershipForm, opts);
    expect(wrapper.get<HTMLButtonElement>(ConfirmButton).element.disabled).toBe(
      true,
    );
  });

  it('will allow the user to select a different membership', async () => {
    const wrapper = mount(MembershipForm, opts);
    await wrapper.get(accountTierRadio(AccountTier.ShopOwner)).setValue(true);
    await wrapper.get(ConfirmButton).trigger('click');
    expect(wrapper.emitted('change-membership')).toEqual([
      [AccountTier.ShopOwner],
    ]);
  });

  it('will allow the user to cancel changing their membership', async () => {
    const wrapper = mount(MembershipForm, opts);
    await wrapper.get(accountTierRadio(AccountTier.Pro)).setValue(true);
    await wrapper.get(CancelButton).trigger('click');
    expect(wrapper.emitted('change-membership')).toBeUndefined();
    expect(wrapper.emitted('cancel')).toBeDefined();
  });
});
