import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';

import { createErrorHandler } from '@/helpers';
import { DefaultUser, UserManager } from '@/client/users';
import { fakeUser } from '../../fixtures/fake-user';
import { initialStoreState } from '../../fixtures/store-state';
import request from 'superagent';
import RequireAuth from '@/components/RequireAuth.vue';
import { ApiClientKey, StoreKey, WithErrorHandlingKey } from '@/injection-keys';
import { Mock } from 'moq.ts';
import { ApiClient } from '@/client';

const agent = request.agent();

describe('RequireAuth Component', () => {
  it('Will render contents if user is logged in', () => {
    const currentUser = new DefaultUser(agent, fakeUser());
    const store = createStore({
      state: initialStoreState({
        currentUser,
      }),
    });
    const withErrorHandling = createErrorHandler(store);
    const userManager = new Mock<UserManager>().object();
    const apiClient = new Mock<ApiClient>()
      .setup((c) => c.users)
      .returns(userManager)
      .object();
    expect(store.state).toBeDefined();
    const wrapper = mount(RequireAuth, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
      slots: {
        default: 'Hello',
      },
    });

    expect(wrapper.text()).toEqual('Hello');
  });

  it('Will render login form if user is not logged in', () => {
    const store = createStore({
      state: initialStoreState,
    });
    const withErrorHandling = createErrorHandler(store);
    const userManager = new Mock<UserManager>().object();
    const apiClient = new Mock<ApiClient>()
      .setup((c) => c.users)
      .returns(userManager)
      .object();
    expect(store.state).toBeDefined();
    const wrapper = mount(RequireAuth, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
      slots: {
        default: 'Hello',
      },
    });

    expect(wrapper.find('form#form-login')).toBeDefined();
  });
});
