import { mount } from '@vue/test-utils';

import { computed } from 'vue';

import { Breadcrumb } from '../../../../src/common';
import BreadCrumbs from '../../../../src/components/common/bread-crumbs.vue';
import { createRouter } from '../../../fixtures/create-router';

describe('Breadcrumbs component', () => {
  it('will render correctly', () => {
    const router = createRouter();
    const crumbs: Breadcrumb[] = [
      { label: 'Top level', to: '/top' },
      { label: 'Middle level', to: '/top/middle' },
      { label: computed(() => 'Inactive') },
      { label: 'Current', active: true },
    ];

    const wrapper = mount(BreadCrumbs, {
      props: { items: crumbs },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
