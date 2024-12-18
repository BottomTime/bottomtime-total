import { ApiClient } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { defineComponent } from 'vue';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import requireAnon from '../../../../src/components/common/require-anon.vue';
import RequireAnon from '../../../../src/components/common/require-anon.vue';
import { useCurrentUser } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

const AnonContent = defineComponent({
  template: '<div>Hello anonymous!</div>',
});

const StartingPage = '/currentPage/something';
const AuthContent = '[data-testid="auth-content"]';
const LogoutButton = '[data-testid="logout-link"]';

describe('RequireAnon component', () => {
  let client: ApiClient;
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof requireAnon>;
  let router: Router;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: StartingPage,
        component: { template: '' },
      },
      {
        path: '/welcome',
        component: { template: '' },
      },
    ]);
  });

  beforeEach(async () => {
    await router.push(StartingPage);
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: { teleport: true },
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
    currentUser.user = BasicUser;
    const spy = jest.spyOn(client.auth, 'logout').mockResolvedValue(true);

    const wrapper = mount(RequireAnon, opts);
    await wrapper.find(LogoutButton).trigger('click');
    await wrapper
      .find('[data-testid="dialog-confirm-button"]')
      .trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe(StartingPage);
    expect(currentUser.user).toBeNull();
  });

  it('will redirect to the "redirectTo" path when the user opts to logout', async () => {
    const redirectTo = '/welcome';
    currentUser.user = BasicUser;
    const spy = jest.spyOn(client.auth, 'logout').mockResolvedValue(true);

    const wrapper = mount(RequireAnon, opts);
    await wrapper.setProps({ redirectTo });
    await wrapper.get(LogoutButton).trigger('click');
    await wrapper
      .find('[data-testid="dialog-confirm-button"]')
      .trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe(redirectTo);
    expect(currentUser.user).toBeNull();
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
