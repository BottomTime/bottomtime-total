import {
  AccountTier,
  DepthUnit,
  DiveSiteDTO,
  LogBookSharing,
} from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import SelectDiveSiteListItem from '../../../../../src/components/diveSites/selectSite/select-dive-site-list-item.vue';

const PartialDiveSite: DiveSiteDTO = {
  createdOn: new Date('2024-05-27T14:51:25.767Z').valueOf(),
  id: '4f5fd49f-734a-4bb7-9912-d58b0f4d61ef',
  name: 'Awesome Site 7',
  creator: {
    accountTier: AccountTier.Basic,
    logBookSharing: LogBookSharing.Private,
    memberSince: new Date('2024-05-27T14:51:25.767Z').valueOf(),
    userId: 'c24863fb-0692-4b17-b8f3-a2adcda6f7c9',
    username: 'user_mcuserson',
  },
  location: 'Somewhere',
};
const FullDiveSite: DiveSiteDTO = {
  ...PartialDiveSite,
  averageDifficulty: 3,
  averageRating: 4.2,
  depth: { depth: 10, unit: DepthUnit.Meters },
  description: 'This site is blue.',
  directions: 'Jump in. Descend.',
  freeToDive: true,
  shoreAccess: true,
  gps: { lat: 45.1234, lon: -123.4567 },
};

const SiteName = `[data-testid="site-name-${PartialDiveSite.id}"]`;
const SelectSiteButton = `[data-testid="select-site-${PartialDiveSite.id}"]`;

describe('SelectDiveSiteListItem component', () => {
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof SelectDiveSiteListItem>;

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia],
      },
      props: { site: PartialDiveSite },
    };
  });

  it('will render with partial dive site', () => {
    const wrapper = mount(SelectDiveSiteListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render with full site data', () => {
    const wrapper = mount(SelectDiveSiteListItem, {
      props: { site: FullDiveSite },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will show as highlighted when selected property is true', () => {
    opts.props = {
      site: PartialDiveSite,
      selected: true,
    };
    const wrapper = mount(SelectDiveSiteListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit highlight event when site name is clicked', async () => {
    const wrapper = mount(SelectDiveSiteListItem, opts);
    await wrapper.get(SiteName).trigger('click');
    expect(wrapper.emitted('highlight')).toEqual([[PartialDiveSite]]);
  });

  it('will emit select event when select button is clicked', async () => {
    const wrapper = mount(SelectDiveSiteListItem, opts);
    await wrapper.get(SelectSiteButton).trigger('click');
    expect(wrapper.emitted('select')).toEqual([[PartialDiveSite]]);
  });
});
