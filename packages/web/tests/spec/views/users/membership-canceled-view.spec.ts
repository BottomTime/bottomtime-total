import { mount } from '@vue/test-utils';

import MembershipCanceledView from '../../../../src/views/users/membership-canceled-view.vue';

describe('Membership Canceled View', () => {
  it('will render', () => {
    const wrapper = mount(MembershipCanceledView);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
