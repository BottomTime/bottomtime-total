import { shallowMount } from '@vue/test-utils';
import request, { SuperAgentStatic } from 'superagent';

import { createStore } from '@/store';
import { DefaultUser, DefaultUserManager, UserManager } from '@/users';
import { fakeUser } from '../../fixtures/fake-user';
import LoginView from '@/views/LoginView.vue';
import {
  StoreKey,
  UserManagerKey,
  WithErrorHandlingKey,
} from '@/injection-keys';
import { initialStoreState } from '../../fixtures/store-state';
import { createErrorHandler } from '@/helpers';

describe('Login View', () => {
  let agent: SuperAgentStatic;
  let userManager: UserManager;

  beforeAll(() => {
    agent = request.agent();
    userManager = new DefaultUserManager(agent);
  });

  it('Will display login form if user is currently browsing anonymously', async () => {
    const store = createStore(initialStoreState());
    const wrapper = shallowMount(LoginView, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
        },
      },
    });
    expect(wrapper.find('div#login-page').isVisible()).toBe(true);
    expect(wrapper.find('div#user-already-authenticated-page').exists()).toBe(
      false,
    );
  });

  it('Will show a helpful message if user is already logged in', async () => {
    const userData = fakeUser();
    const store = createStore(
      initialStoreState({
        currentUser: new DefaultUser(agent, userData),
      }),
    );
    const wrapper = shallowMount(LoginView, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
        },
      },
    });
    expect(wrapper.find('div#login-page').exists()).toBe(false);
    expect(
      wrapper.find('div#user-already-authenticated-page').isVisible(),
    ).toBe(true);
  });
});
