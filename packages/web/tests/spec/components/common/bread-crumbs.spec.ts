import { mount } from '@vue/test-utils';

import { Breadcrumb } from '../../../../src/common';
import BreadCrumbs from '../../../../src/components/common/bread-crumbs.vue';

describe('Breadcrumbs component', () => {
  it('will render correctly', () => {
    const crumbs: Breadcrumb[] = [
      { label: 'Top level', to: '/top' },
      { label: 'Middle level', to: '/top/middle' },
      { label: () => 'Inactive' },
      { label: 'Current', active: true },
    ];

    const wrapper = mount(BreadCrumbs, {
      props: { items: crumbs },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
