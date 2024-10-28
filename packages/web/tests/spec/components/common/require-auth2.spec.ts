import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import RequireAuth from '../../../../src/components/common/require-auth2.vue';
import { LocationKey, MockLocation } from '../../../../src/location';
import { useCurrentUser } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

const ProtectedContent = '#protected';
const LoginForm = '[data-testid="require-auth-anonymous"]';
const ForbiddenMessage = '[data-testid="forbidden-message"]';

describe('Require Auth component (v2)', () => {
  let client: ApiClient;
  let location: MockLocation;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof RequireAuth>;
  let authorize: boolean;

  beforeAll(() => {
    client = new ApiClient();
    location = new MockLocation();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = null;
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: location,
        },
        stubs: {
          teleport: true,
        },
      },
      props: {
        authorizer: () => authorize,
      },
      slots: {
        default: { template: '<div id="protected">Protected Content</div>' },
      },
    };
    authorize = false;
  });

  it('will show content to anonymous users if authorizer passes', () => {
    authorize = true;
    const wrapper = mount(RequireAuth, opts);
    expect(wrapper.find(ProtectedContent).isVisible()).toBe(true);
    expect(wrapper.find(LoginForm).exists()).toBe(false);
    expect(wrapper.find(ForbiddenMessage).exists()).toBe(false);
  });

  it('will show content to authenticated users if authorizer passes', () => {
    currentUser.user = BasicUser;
    authorize = true;
    const wrapper = mount(RequireAuth, opts);
    expect(wrapper.find(ProtectedContent).isVisible()).toBe(true);
    expect(wrapper.find(LoginForm).exists()).toBe(false);
    expect(wrapper.find(ForbiddenMessage).exists()).toBe(false);
  });

  it('will show login form to anonymous users if authorizer fails', () => {
    const wrapper = mount(RequireAuth, opts);
    expect(wrapper.find(ProtectedContent).exists()).toBe(false);
    expect(wrapper.find(LoginForm).isVisible()).toBe(true);
    expect(wrapper.find(ForbiddenMessage).exists()).toBe(false);
  });

  it('will show forbidden message to authenticated users if authorizer fails', () => {
    currentUser.user = BasicUser;
    const wrapper = mount(RequireAuth, opts);
    expect(wrapper.find(ProtectedContent).exists()).toBe(false);
    expect(wrapper.find(LoginForm).exists()).toBe(false);
    expect(wrapper.find(ForbiddenMessage).isVisible()).toBe(true);
  });

  it('will hide content if authorizer is `false`', () => {
    const wrapper = mount(RequireAuth, {
      ...opts,
      props: { authorizer: false },
    });
    expect(wrapper.find(ProtectedContent).exists()).toBe(false);
    expect(wrapper.find(LoginForm).exists()).toBe(true);
    expect(wrapper.find(ForbiddenMessage).exists()).toBe(false);
  });

  it('will show content if authorizer is `true`', () => {
    const wrapper = mount(RequireAuth, {
      ...opts,
      props: { authorizer: true },
    });
    expect(wrapper.find(ProtectedContent).isVisible()).toBe(true);
    expect(wrapper.find(LoginForm).exists()).toBe(false);
    expect(wrapper.find(ForbiddenMessage).exists()).toBe(false);
  });
});
