import { Mock } from 'moq.ts';
import { mount } from '@vue/test-utils';

import { createErrorHandler } from '@/helpers';
import { createStore } from '@/store';
import AccountView from '@/views/AccountView.vue';
import { ApiClientKey, StoreKey, WithErrorHandlingKey } from '@/injection-keys';
import { UserManager } from '@/client/users';
import { ApiClient } from '@/client';

describe('Account View', () => {
  const userManager = new Mock<UserManager>().object();
  const apiClient = new Mock<ApiClient>()
    .setup((c) => c.users)
    .returns(userManager)
    .object();
  it.todo('Write these tests...');

  it('Will mount', () => {
    const store = createStore();
    const withErrorHandling = createErrorHandler(store);
    mount(AccountView, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
  });
});
