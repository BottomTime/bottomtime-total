import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';

import { createErrorHandler } from '@/helpers';
import { DefaultUser } from '@/users';
import { fakeUser } from '../../fixtures/fake-user';
import { initialStoreState } from '../../fixtures/store-state';
import request from 'superagent';
import RequireAuth from '@/components/RequireAuth.vue';
import {
  StoreKey,
  UserManagerKey,
  WithErrorHandlingKey,
} from '@/injection-keys';
import { TestUserManager } from '../../fixtures/test-user-manager';

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
    const userManager = new TestUserManager();
    expect(store.state).toBeDefined();
    const wrapper = mount(RequireAuth, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [UserManagerKey as symbol]: userManager,
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
    const userManager = new TestUserManager();
    expect(store.state).toBeDefined();
    const wrapper = mount(RequireAuth, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [UserManagerKey as symbol]: userManager,
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
