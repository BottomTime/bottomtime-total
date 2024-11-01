import { ApiClient } from '@bottomtime/api';
import { ManageDiveOperatorsFeature } from '@bottomtime/common';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import NavBar from '../../../../src/components/core/nav-bar.vue';
import { FeaturesServiceKey } from '../../../../src/featrues';
import { LocationKey, MockLocation } from '../../../../src/location';
import { useCurrentUser } from '../../../../src/store';
import { ConfigCatClientMock } from '../../../config-cat-client-mock';
import { createRouter } from '../../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../../fixtures/users';

const HamburgerButton = '[data-testid="hamburger-button"]';
const HamburgerDropdown = '[data-testid="hamburger-menu"]';

const UserMenuButton = '[data-testid="user-menu-button"]';
const UserDropdown = '[data-testid="user-dropdown"]';

const LoginButton = '[data-testid="login-button"]';
const LoginLink = '[data-testid="login-link"]';

describe('Nav Bar component', () => {
  let client: ApiClient;
  let router: Router;
  let features: ConfigCatClientMock;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof NavBar>;

  beforeAll(() => {
    features = new ConfigCatClientMock();
    client = new ApiClient();
    router = createRouter();
    localStorage.setItem('darkMode', 'true');
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    features.flags[ManageDiveOperatorsFeature.key] = true;
    opts = {
      global: {
        directives: {
          'click-outside': jest.fn(),
        },
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [FeaturesServiceKey as symbol]: features,
          [LocationKey as symbol]: new MockLocation(),
        },
        stubs: {
          teleport: true,
        },
      },
    };
  });

  afterAll(() => {
    localStorage.removeItem('darkMode');
  });

  it('will render correctly for anonymous users', async () => {
    currentUser.user = null;
    const wrapper = mount(NavBar, opts);
    await flushPromises();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for authenticated users', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(NavBar, opts);
    await flushPromises();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for admins', async () => {
    currentUser.user = AdminUser;
    const wrapper = mount(NavBar, opts);
    await flushPromises();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will allow authenticated users to open and close the user dropdown', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(NavBar, opts);

    const dropdownButton = wrapper.find(UserMenuButton);
    await dropdownButton.trigger('click');
    expect(wrapper.find(UserDropdown).isVisible()).toBe(true);

    await dropdownButton.trigger('click');
    expect(wrapper.find(UserDropdown).isVisible()).toBe(false);
  });

  it('will allow users to open and close the hamburger menu', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(NavBar, opts);

    const hamburgerButton = wrapper.find(HamburgerButton);
    await hamburgerButton.trigger('click');
    expect(wrapper.find(HamburgerDropdown).classes()).not.toContain('hidden');

    await hamburgerButton.trigger('click');
    expect(wrapper.find(HamburgerDropdown).classes()).toContain('hidden');
  });

  it('will reveal login form when login button is clicked', async () => {
    currentUser.user = null;
    const wrapper = mount(NavBar, opts);

    const loginButton = wrapper.find(LoginButton);
    await loginButton.trigger('click');

    expect(wrapper.find('[data-testid="login-submit"]').isVisible()).toBe(true);
  });

  it('will reveal login from when login link is clicked', async () => {
    currentUser.user = null;
    const wrapper = mount(NavBar, opts);

    const loginLink = wrapper.find(LoginLink);
    await loginLink.trigger('click');

    expect(wrapper.find('[data-testid="login-submit"]').isVisible()).toBe(true);
  });
});
