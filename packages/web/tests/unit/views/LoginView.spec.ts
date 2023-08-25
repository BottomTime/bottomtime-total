import { mount } from '@vue/test-utils';
import request, { SuperAgentStatic } from 'superagent';

import { createErrorHandler } from '@/helpers';
import { createStore } from '@/store';
import { DefaultUser, DefaultUserManager, UserManager } from '@/client/users';
import { fakeUser } from '../../fixtures/fake-user';
import LoginView from '@/views/LoginView.vue';
import { Mock } from 'moq.ts';
import {
  StoreKey,
  UserManagerKey,
  WithErrorHandlingKey,
} from '@/injection-keys';
import { initialStoreState } from '../../fixtures/store-state';
import { UserManager } from '@/users';

describe('Login View', () => {
  const userManager = new Mock<UserManager>().object;
  let agent: SuperAgentStatic;

  beforeAll(() => {
    agent = request.agent();
  });

  it('Will display login form if user is currently browsing anonymously', async () => {
    const store = createStore(initialStoreState());
    const errorHandler = createErrorHandler(store);
    const wrapper = mount(LoginView, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [UserManagerKey as symbol]: userManager,
          [WithErrorHandlingKey as symbol]: errorHandler,
        },
      },
    });
    expect(wrapper.find('div#login-page').isVisible()).toBe(true);
    expect(wrapper.find('div#user-logged-in-content').exists()).toBe(false);
  });

  it('Will show a helpful message if user is already logged in', async () => {
    const userData = fakeUser();
    const store = createStore(
      initialStoreState({
        currentUser: new DefaultUser(agent, userData),
      }),
    );
    const errorHandler = createErrorHandler(store);
    const wrapper = mount(LoginView, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [UserManagerKey as symbol]: userManager,
          [WithErrorHandlingKey as symbol]: errorHandler,
        },
      },
    });
    expect(wrapper.find('div#login-page').exists()).toBe(false);
    expect(wrapper.find('div#user-logged-in-content').isVisible()).toBe(true);
  });
});
