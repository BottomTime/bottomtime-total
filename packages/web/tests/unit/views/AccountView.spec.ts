import { Mock } from 'moq.ts';
import { mount } from '@vue/test-utils';

import { createErrorHandler } from '@/helpers';
import { createStore } from '@/store';
import AccountView from '@/views/AccountView.vue';
import {
  StoreKey,
  UserManagerKey,
  WithErrorHandlingKey,
} from '@/injection-keys';
import { UserManager } from '@/users';

describe('Account View', () => {
  it.todo('Write these tests...');

  it('Will mount', () => {
    const store = createStore();
    const withErrorHandling = createErrorHandler(store);
    const userManager = new Mock<UserManager>().object;
    mount(AccountView, {
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
