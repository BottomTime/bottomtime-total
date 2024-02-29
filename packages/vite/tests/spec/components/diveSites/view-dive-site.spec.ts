import ViewDiveSite from '@/components/diveSites/view-dive-site.vue';
import { mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import {
  DiveSiteWithFullProperties,
  DiveSiteWithMinimalProperties,
} from '../../../fixtures/sites';

describe('View Dive Site component', () => {
  let pinia: Pinia;

  beforeEach(() => {
    pinia = createPinia();
  });

  it('will render site with full details', () => {
    const wrapper = mount(ViewDiveSite, {
      props: {
        site: DiveSiteWithFullProperties,
      },
      global: {
        plugins: [pinia],
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render site with minimal details', () => {
    const wrapper = mount(ViewDiveSite, {
      props: {
        site: DiveSiteWithMinimalProperties,
      },
      global: {
        plugins: [pinia],
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
