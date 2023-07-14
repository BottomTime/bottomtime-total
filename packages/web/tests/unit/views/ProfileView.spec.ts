import { Mock } from 'moq.ts';
import { mount } from '@vue/test-utils';

import { createErrorHandler } from '@/helpers';
import { createStore } from '@/store';
import ProfileView from '@/views/ProfileView.vue';
import {
  StoreKey,
  UserManagerKey,
  WithErrorHandlingKey,
} from '@/injection-keys';
import { UserManager } from '@/users';

describe('Profile View', () => {
  it.todo('Finish writing tests here.');

  it('Will mount', async () => {
    const store = createStore();
    const withErrorHandling = createErrorHandler(store);
    const userManager = new Mock<UserManager>().object;
    const wrapper = mount(ProfileView, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [UserManagerKey as symbol]: userManager,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
  });
});
