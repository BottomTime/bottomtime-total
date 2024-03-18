import DiveSitesListItem from '@/components/diveSites/dive-sites-list-item.vue';
import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import {
  DiveSiteWithFullProperties,
  DiveSiteWithMinimalProperties,
} from '../../../fixtures/sites';

describe('Dive Sites List Item component', () => {
  let pinia: Pinia;
  let global: ComponentMountingOptions<typeof DiveSitesListItem>['global'];

  beforeEach(() => {
    pinia = createPinia();
    global = {
      plugins: [pinia],
    };
  });

  it('will render a dive site with minimal properties', () => {
    const wrapper = mount(DiveSitesListItem, {
      props: { site: DiveSiteWithMinimalProperties },
      global,
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render a dive site with full properties', () => {
    const wrapper = mount(DiveSitesListItem, {
      props: { site: DiveSiteWithFullProperties },
      global,
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit event when name of site is clicked', async () => {
    const wrapper = mount(DiveSitesListItem, {
      props: { site: DiveSiteWithMinimalProperties },
      global,
    });

    await wrapper
      .get(`[data-testid="select-site-${DiveSiteWithMinimalProperties.id}"]`)
      .trigger('click');

    expect(wrapper.emitted('site-selected')).toEqual([
      [DiveSiteWithMinimalProperties],
    ]);
  });

  it('will emit event when name of creator is clicked', async () => {
    const wrapper = mount(DiveSitesListItem, {
      props: { site: DiveSiteWithMinimalProperties },
      global,
    });

    await wrapper
      .get(`[data-testid="site-creator-${DiveSiteWithMinimalProperties.id}"]`)
      .trigger('click');

    expect(wrapper.emitted('user-selected')).toEqual([
      [DiveSiteWithMinimalProperties.creator.username],
    ]);
  });
});
