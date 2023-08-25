import { Mock } from 'moq.ts';
import { mount } from '@vue/test-utils';
import request from 'superagent';

import CreateNewPasswordView from '@/views/CreateNewPasswordView.vue';
import { ApiClientKey, StoreKey, WithErrorHandlingKey } from '@/injection-keys';
import { createStore } from '@/store';
import { initialStoreState } from '../../fixtures/store-state';
import { fakeUser } from '../../fixtures/fake-user';
import { DefaultUser, UserManager } from '@/client/users';
import { createErrorHandler } from '@/helpers';
import router from '@/router';
import { ApiClient } from '@/client';

describe('Create New Password View', () => {
  const agent = request.agent();
  const userManager = new Mock<UserManager>().object();
  const apiClient = new Mock<ApiClient>()
    .setup((c) => c.users)
    .returns(userManager)
    .object();
  const route = `/newPassword?user=Borat87&token=f23908h48h209ejf2489yrh20`;

  it('Will ask user for new password if the user is anonymous', async () => {
    const store = createStore(initialStoreState());
    const withErrorHandling = createErrorHandler(store);
    await router.push(route);

    const wrapper = mount(CreateNewPasswordView, {
      global: {
        plugins: [router],
        provide: {
          [StoreKey as symbol]: store,
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });

    expect(wrapper.find('article#msg-invalid-query').exists()).toBe(false);
    expect(wrapper.find('input#newPassword').isVisible()).toBe(true);
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
    await router.push(route);

    const wrapper = mount(CreateNewPasswordView, {
      global: {
        mocks: {
          $route: route,
        },
        plugins: [router],
        provide: {
          [StoreKey as symbol]: store,
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });

    expect(wrapper.find('article#msg-invalid-query').exists()).toBe(false);
    expect(wrapper.find('input#newPassword').exists()).toBe(false);
    expect(wrapper.find('div#user-logged-in-content').isVisible()).toBe(true);
  });

  it('Will display a helpful message if the query string is invalid', async () => {
    const store = createStore(initialStoreState());
    const withErrorHandling = createErrorHandler(store);
    await router.push('/newPassword');

    const wrapper = mount(CreateNewPasswordView, {
      global: {
        plugins: [router],
        provide: {
          [StoreKey as symbol]: store,
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });

    // expect(wrapper.find('article#msg-invalid-query').isVisible()).toBe(true);
    expect(wrapper.find('input#newPassword').exists()).toBe(false);
    expect(wrapper.find('div#user-logged-in-content').exists()).toBe(false);
  });
});
