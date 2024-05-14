import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { defineComponent } from 'vue';

import requireAnon from '../../../../src/components/common/require-anon.vue';
import RequireAnon from '../../../../src/components/common/require-anon.vue';
import { LocationKey, MockLocation } from '../../../../src/location';
import { useCurrentUser } from '../../../../src/store';
import { BasicUser } from '../../../fixtures/users';

const AnonContent = defineComponent({
  template: '<div>Hello anonymous!</div>',
});

const AuthContent = '[data-testid="auth-content"]';
const LogoutButton = '[data-testid="logout-link"]';

describe('RequireAnon component', () => {
  let location: MockLocation;
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof requireAnon>;

  beforeEach(() => {
    location = new MockLocation();
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    opts = {
      global: {
        plugins: [pinia],
        provide: {
          [LocationKey as symbol]: location,
        },
      },
      slots: {
        default: AnonContent,
      },
    };
  });

  it('will render content if user is anonymous', () => {
    const wrapper = mount(RequireAnon, opts);
    expect(wrapper.findComponent(AnonContent).isVisible()).toBe(true);
    expect(wrapper.find(AuthContent).exists()).toBe(false);
  });

  it('will render a helpful message with links if user is authenticated', () => {
    currentUser.user = BasicUser;
    const wrapper = mount(RequireAnon, opts);
    expect(wrapper.findComponent(AnonContent).exists()).toBe(false);
    expect(wrapper.find(AuthContent).isVisible()).toBe(true);
  });

  it('will redirect back to the current page, by default, when the user opts to logout', async () => {
    opts.props = {};
    location.assign('/currentPage/user');
    currentUser.user = BasicUser;
    const wrapper = mount(RequireAnon, opts);
    await wrapper.find(LogoutButton).trigger('click');
    await wrapper
      .find('[data-testid="dialog-confirm-button"]')
      .trigger('click');
    await flushPromises();
    expect(location.search).toBe('?redirectTo=%2FcurrentPage%2Fuser');
  });

  it('will redirect to the "redirectTo" path when the user opts to logout', async () => {
    const redirectTo = '/welcome';
    currentUser.user = BasicUser;
    opts.props = { redirectTo };
    const wrapper = mount(RequireAnon, opts);
    await wrapper.find(LogoutButton).trigger('click');
    await wrapper
      .find('[data-testid="dialog-confirm-button"]')
      .trigger('click');
    await flushPromises();
    expect(location.search).toBe('?redirectTo=%2Fwelcome');
  });

  it('will allow the user to change their mind about logging out', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(RequireAnon, opts);
    await wrapper.find(LogoutButton).trigger('click');
    await wrapper.find('[data-testid="dialog-cancel-button"]').trigger('click');
    expect(wrapper.find('[data-testid="dialog-confirm-button"]').exists()).toBe(
      false,
    );
  });
});
