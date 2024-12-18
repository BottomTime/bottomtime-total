import { mount } from '@vue/test-utils';

import NavLink from '../../../../src/components/common/nav-link.vue';
import { createRouter } from '../../../fixtures/create-router';

describe('Nav Link component', () => {
  it('will render an internal link', () => {
    const router = createRouter();
    const wrapper = mount(NavLink, {
      props: {
        to: '/login',
        label: 'Login',
      },
      slots: {
        default: 'Click to Login',
      },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render an external link', () => {
    const router = createRouter();
    const wrapper = mount(NavLink, {
      props: {
        to: 'https://somewesite.com/',
        label: 'External Site',
      },
      slots: {
        default: 'W00T!',
      },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
