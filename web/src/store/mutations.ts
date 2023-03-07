import { MutationTree } from 'vuex';

import { BTState } from './state';
import { Toast } from '@/helpers';
import { User } from '@/users';

export const Commit = {
  AddToast: 'addToast',
  RemoveToast: 'removeToast',
  SetCurrentUser: 'setCurrentUser',
} as const;

export const mutations: MutationTree<BTState> = {
  [Commit.AddToast]: (state, toast: Toast) => {
    state.toasts[toast.id] = toast;
  },

  [Commit.RemoveToast]: (state, toastId: string) => {
    delete state.toasts[toastId];
  },

  [Commit.SetCurrentUser]: (state, currentUser: User | undefined) => {
    state.currentUser = currentUser;
  },
};
