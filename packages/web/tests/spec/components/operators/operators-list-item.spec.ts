import { OperatorDTO, VerificationStatus } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import OperatorslistItem from '../../../../src/components/operators/operators-list-item.vue';
import { BasicUser } from '../../../fixtures/users';

const MinimalTestData: OperatorDTO = {
  active: true,
  address: '123 Street St.',
  createdAt: new Date(),
  description: 'Dive shop with a boat',
  id: '8e18dc69-df18-40f6-8e12-4978cebfadba',
  name: 'A Dive Shop',
  owner: BasicUser.profile,
  slug: 'a-dive-shop',
  updatedAt: new Date(),
  verificationStatus: VerificationStatus.Unverified,
};
const FullTestData: OperatorDTO = {
  ...MinimalTestData,
  banner: 'https://logo.com/banner',
  email: 'email@email.org',
  gps: {
    lat: 1,
    lon: -1,
  },
  logo: 'https://logo.com/logo',
  phone: '1 (111) 111-1111',
  socials: {
    facebook: 'facebook',
    instagram: 'instagram',
    tiktok: 'tiktok',
    twitter: 'omg_elon_sucks',
    youtube: 'youtube',
  },
  website: 'https://site.com',
};

describe('OperatorsListItem component', () => {
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof OperatorslistItem>;

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia],
      },
    };
  });

  it('will render with minimal properties', () => {
    const wrapper = mount(OperatorslistItem, {
      ...opts,
      props: { operator: MinimalTestData },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render with full properties', () => {
    const wrapper = mount(OperatorslistItem, {
      ...opts,
      props: { operator: FullTestData },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
