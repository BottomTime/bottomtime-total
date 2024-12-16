import { mount } from '@vue/test-utils';

import MembershipCanceledView from '../../../../src/views/users/membership-canceled-view.vue';
import { createRouter } from '../../../fixtures/create-router';

describe('Membership Canceled View', () => {
  it('will render', () => {
    const router = createRouter();
    const wrapper = mount(MembershipCanceledView, {
      global: { plugins: [router] },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
