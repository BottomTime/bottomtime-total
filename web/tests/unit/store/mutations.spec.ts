import { Mock } from 'moq.ts';

import { Commit, mutations } from '@/store';
import { initialStoreState } from '../../fixtures/store-state';
import { Toast, ToastType } from '@/helpers';
import { User } from '@/users';

describe('Store Mutations', () => {
  it('Will set current user to a new value', () => {
    const state = initialStoreState();
    const user = new Mock<User>()
      .setup((instance) => instance.id)
      .returns('abc123')
      .object();
    mutations[Commit.SetCurrentUser](state, user);
    expect(state.currentUser).toBe(user);
  });

  it('Will set current user to undefined', () => {
    const user = new Mock<User>()
      .setup((instance) => instance.id)
      .returns('abc123')
      .object();
    const state = initialStoreState({ currentUser: user });
    mutations[Commit.SetCurrentUser](state, undefined);
    expect(state.currentUser).toBeUndefined();
  });

  it('Will add a toast', () => {
    const toast: Toast = {
      id: 'my-toast',
      type: ToastType.Info,
      message: 'This is a toast.',
    };
    const state = initialStoreState();
    mutations[Commit.AddToast](state, toast);
    expect(state.toasts).toEqual({
      [toast.id]: toast,
    });
  });

  it('Will clear a toast', () => {
    const toast: Toast = {
      id: 'my-toast',
      type: ToastType.Info,
      message: 'This is a toast.',
    };
    const state = initialStoreState({
      toasts: {
        [toast.id]: toast,
      },
    });
    mutations[Commit.RemoveToast](state, toast.id);
    expect(state.toasts).toEqual({});
  });
});
