import { Mock } from 'moq.ts';
import { mount } from '@vue/test-utils';
import request from 'superagent';

import { createStore } from '@/store';
import { fakeUser } from '../../fixtures/fake-user';
import { initialStoreState } from '../../fixtures/store-state';
import SignUpView from '@/views/SignupView.vue';
import {
  StoreKey,
  UserManagerKey,
  WithErrorHandlingKey,
} from '@/injection-keys';
import { DefaultUser, UserManager } from '@/users';
import { createErrorHandler } from '@/helpers';

describe('Sign Up Page', () => {
  const userManager = new Mock<UserManager>().object;

  it('Will display the signup form if the user is anonymous', async () => {
    const store = createStore(initialStoreState());
    const errorHandler = createErrorHandler(store);
    const wrapper = mount(SignUpView, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [UserManagerKey as symbol]: userManager,
          [WithErrorHandlingKey as symbol]: errorHandler,
        },
      },
    });
    expect(wrapper.find('div#signup-page').isVisible()).toBe(true);
    expect(wrapper.find('div#user-logged-in-content').exists()).toBe(false);
  });

  it('Will show a helpful message if the user is already logged in', async () => {
    const userData = fakeUser();
    const store = createStore(
      initialStoreState({
        currentUser: new DefaultUser(request.agent(), userData),
      }),
    );
    const errorHandler = createErrorHandler(store);
    const wrapper = mount(SignUpView, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [UserManagerKey as symbol]: userManager,
          [WithErrorHandlingKey as symbol]: errorHandler,
        },
      },
    });
    expect(wrapper.find('div#signup-page').exists()).toBe(false);
    expect(wrapper.find('div#user-logged-in-content').isVisible()).toBe(true);
  });
});
