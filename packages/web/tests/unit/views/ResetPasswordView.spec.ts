import { Mock } from 'moq.ts';
import { mount } from '@vue/test-utils';
import request from 'superagent';

import ResetPasswordView from '@/views/ResetPasswordView.vue';
import { ApiClientKey, StoreKey, WithErrorHandlingKey } from '@/injection-keys';
import { createStore } from '@/store';
import { initialStoreState } from '../../fixtures/store-state';
import { fakeUser } from '../../fixtures/fake-user';
import { DefaultUser, UserManager } from '@/client/users';
import { createErrorHandler } from '@/helpers';
import { ApiClient } from '@/client';

describe('Reset Password View', () => {
  const agent = request.agent();
  const userManager = new Mock<UserManager>().object();
  const apiClient = new Mock<ApiClient>()
    .setup((c) => c.users)
    .returns(userManager)
    .object();

  it('Will ask user for username or email if the user is anonymous', async () => {
    const store = createStore(initialStoreState());
    const withErrorHandling = createErrorHandler(store);
    const wrapper = mount(ResetPasswordView, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    expect(wrapper.find('input#usernameOrEmail').isVisible()).toBe(true);
    expect(wrapper.find('div#user-logged-in-content').exists()).toBe(false);
  });

  it('Will display a helpful message if the user is already logged in', async () => {
    const currentUser = fakeUser();
    const store = createStore(
      initialStoreState({
        currentUser: new DefaultUser(agent, currentUser),
      }),
    );
    const withErrorHandling = createErrorHandler(store);
    const wrapper = mount(ResetPasswordView, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    expect(wrapper.find('input#usernameOrEmail').exists()).toBe(false);
    expect(wrapper.find('div#user-logged-in-content').isVisible()).toBe(true);
  });
});
