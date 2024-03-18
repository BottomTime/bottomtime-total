import { UserDTO, UserRole } from '@bottomtime/api';

import RequireAuth from '@/components/common/require-auth.vue';
import { shallowMount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import { AdminUser, BasicUser } from '../../../fixtures/users';

const SecureContent = '<div>Protected Content</div>';

function getPinia(user?: UserDTO): Pinia {
  const pinia = createPinia();
  pinia.state.value.currentUser = {
    user: user ?? null,
  };

  return pinia;
}

describe('Require Auth component', () => {
  it('will show protected content if user is authenticated', () => {
    const pinia = getPinia(BasicUser);
    const wrapper = shallowMount(RequireAuth, {
      global: {
        plugins: [pinia],
        renderStubDefaultSlot: true,
      },
      slots: {
        default: SecureContent,
      },
    });

    expect(wrapper.html()).toContain(SecureContent);
  });

  it('will display the login form if the user is not authenticated', () => {
    const pinia = getPinia();
    const wrapper = shallowMount(RequireAuth, {
      global: {
        plugins: [pinia],
        renderStubDefaultSlot: true,
      },
      slots: {
        default: SecureContent,
      },
    });

    expect(wrapper.html()).not.toContain(SecureContent);

    const actualContent = wrapper.find(
      '[data-testid="require-auth-anonymous"]',
    );
    expect(actualContent.isVisible()).toBe(true);
  });

  it('will allow admins to see admin-only content', () => {
    const pinia = getPinia(AdminUser);
    const wrapper = shallowMount(RequireAuth, {
      props: {
        role: UserRole.Admin,
      },
      global: {
        plugins: [pinia],
        renderStubDefaultSlot: true,
      },
      slots: {
        default: SecureContent,
      },
    });

    expect(wrapper.html()).toContain(SecureContent);
  });

  it('will not allow regular users to see admin-only content', () => {
    const pinia = getPinia(BasicUser);
    const wrapper = shallowMount(RequireAuth, {
      props: {
        role: UserRole.Admin,
      },
      global: {
        plugins: [pinia],
        renderStubDefaultSlot: true,
      },
      slots: {
        default: SecureContent,
      },
    });

    expect(wrapper.html()).not.toContain(SecureContent);

    const actualContent = wrapper.find(
      '[data-testid="require-auth-unauthorized"]',
    );
    expect(actualContent.isVisible()).toBe(true);
  });

  it('will not allow anonymous users to view admin-only content', () => {
    const pinia = getPinia();
    const wrapper = shallowMount(RequireAuth, {
      props: {
        role: UserRole.Admin,
      },
      global: {
        plugins: [pinia],
        renderStubDefaultSlot: true,
      },
      slots: {
        default: SecureContent,
      },
    });

    expect(wrapper.html()).not.toContain(SecureContent);

    const actualContent = wrapper.find(
      '[data-testid="require-auth-anonymous"]',
    );
    expect(actualContent.isVisible()).toBe(true);
  });
});
