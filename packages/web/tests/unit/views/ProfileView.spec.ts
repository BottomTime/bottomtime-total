import { Mock } from 'moq.ts';
import { mount } from '@vue/test-utils';

import { createErrorHandler } from '@/helpers';
import { createStore } from '@/store';
import ProfileView from '@/views/ProfileView.vue';
import { ApiClientKey, StoreKey, WithErrorHandlingKey } from '@/injection-keys';
import { UserManager } from '@/client/users';
import { ApiClient } from '@/client';

describe('Profile View', () => {
  const userManager = new Mock<UserManager>().object();
  const apiClient = new Mock<ApiClient>()
    .setup((c) => c.users)
    .returns(userManager)
    .object();

  it.todo('Finish writing tests here.');

  it('Will mount', async () => {
    const store = createStore();
    const withErrorHandling = createErrorHandler(store);
    const wrapper = mount(ProfileView, {
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
