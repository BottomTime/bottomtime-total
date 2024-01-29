import { mount } from '@vue/test-utils';
import NavLink from '../../../../src/components/common/nav-link.vue';

describe('Nav Link component', () => {
  it('will render a link', () => {
    const wrapper = mount(NavLink, {
      props: {
        to: '/login',
        label: 'Login',
      },
      slots: {
        default: 'Click to Login',
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
