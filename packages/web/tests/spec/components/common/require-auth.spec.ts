import { ApiClient, UserRole } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { defineComponent } from 'vue';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import ForbiddenMessage from '../../../../src/components/common/forbidden-message.vue';
import RequireAuth from '../../../../src/components/common/require-auth.vue';
import LoginForm from '../../../../src/components/users/login-form.vue';
import { useCurrentUser } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../../fixtures/users';

const SecureContent = defineComponent({
  template: '<div>Protected Content</div>',
});

describe('Require Auth component', () => {
  let router: Router;
  let client: ApiClient;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof RequireAuth>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
      slots: {
        default: SecureContent,
      },
    };
  });

  it('will show protected content if user is authenticated', () => {
    currentUser.user = BasicUser;
    const wrapper = mount(RequireAuth, opts);
    expect(wrapper.findComponent(SecureContent).isVisible()).toBe(true);
  });

  it('will display the login form if the user is not authenticated', () => {
    currentUser.user = null;
    const wrapper = mount(RequireAuth, opts);
    expect(wrapper.findComponent(SecureContent).exists()).toBe(false);
    expect(wrapper.findComponent(LoginForm).isVisible()).toBe(true);
  });

  it('will allow admins to see admin-only content', () => {
    currentUser.user = AdminUser;
    opts.props = { role: UserRole.Admin };
    const wrapper = mount(RequireAuth, opts);
    expect(wrapper.findComponent(SecureContent).isVisible()).toBe(true);
  });

  it('will not allow regular users to see admin-only content', () => {
    currentUser.user = BasicUser;
    opts.props = { role: UserRole.Admin };
    const wrapper = mount(RequireAuth, opts);
    expect(wrapper.findComponent(SecureContent).exists()).toBe(false);
    expect(wrapper.findComponent(ForbiddenMessage).isVisible()).toBe(true);
  });

  it('will not allow anonymous users to view admin-only content', () => {
    currentUser.user = null;
    opts.props = { role: UserRole.Admin };
    const wrapper = mount(RequireAuth, opts);
    expect(wrapper.findComponent(SecureContent).exists()).toBe(false);
    expect(wrapper.findComponent(LoginForm).isVisible()).toBe(true);
  });

  it('will show protected content if authCheck returns true', () => {
    currentUser.user = BasicUser;
    opts.props = { authCheck: () => true };
    const wrapper = mount(RequireAuth, opts);
    expect(wrapper.findComponent(SecureContent).isVisible()).toBe(true);
  });

  it('will show forbidden message if authCheck returns false', () => {
    currentUser.user = BasicUser;
    opts.props = { authCheck: () => false };
    const wrapper = mount(RequireAuth, opts);
    expect(wrapper.findComponent(SecureContent).exists()).toBe(false);
    expect(wrapper.findComponent(ForbiddenMessage).isVisible()).toBe(true);
  });
});
