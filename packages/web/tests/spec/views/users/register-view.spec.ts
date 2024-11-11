import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import RegisterForm from '../../../../src/components/users/register-form.vue';
import { useCurrentUser } from '../../../../src/store';
import RegisterView from '../../../../src/views/users/register-view.vue';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

describe('Account View', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof RegisterView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          teleport: true,
        },
      },
    };
  });

  it('will not show the registration form if user is authenticated', () => {
    const currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;
    const wrapper = mount(RegisterView, opts);
    expect(wrapper.get('[data-testid="require-anonymous"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.findComponent(RegisterForm).exists()).toBe(false);
  });

  it('will allow the user to register a new account', () => {
    const wrapper = mount(RegisterView, opts);
    expect(wrapper.find('[data-testid="require-anonymous"]').exists()).toBe(
      false,
    );
    expect(wrapper.getComponent(RegisterForm).isVisible()).toBe(true);
  });
});
