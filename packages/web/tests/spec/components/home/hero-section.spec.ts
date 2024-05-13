import { ComponentMountingOptions } from '@vue/test-utils';
import { mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import HeroSection from '../../../../src/components/home/hero-section.vue';
import { useCurrentUser } from '../../../../src/store';
import { BasicUser } from '../../../fixtures/users';

describe('HeroSection component', () => {
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof HeroSection>;

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      global: {
        plugins: [pinia],
      },
    };
  });

  it('will render correclty if user is authenticated', () => {
    currentUser.user = BasicUser;
    const wrapper = mount(HeroSection, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for anonymous users', () => {
    currentUser.user = null;
    const wrapper = mount(HeroSection, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
