import { ActionTree } from 'vuex';
import { BTState } from './state';
import { Commit } from './mutations';
import { Toast } from '@/helpers';
import { User } from '@/client/users';

export const Dispatch = {
  DismissToast: 'dismissToast',
  SignInUser: 'signInUser',
  SignOutUser: 'signOutUser',
  Toast: 'toast',
} as const;

export const actions: ActionTree<BTState, BTState> = {
  [Dispatch.DismissToast]: ({ commit, state }, toastId: string) => {
    const toast = state.toasts[toastId];
    if (toast) {
      if (toast.timer) {
        clearTimeout(toast.timer);
      }

      commit(Commit.RemoveToast, toast.id);
    }
  },

  [Dispatch.SignInUser]: ({ commit }, user: User) => {
    commit(Commit.SetCurrentUser, user);
  },

  [Dispatch.SignOutUser]: ({ commit }) => {
    commit(Commit.SetCurrentUser, undefined);
  },

  [Dispatch.Toast]: async ({ commit, dispatch, state }, toast: Toast) => {
    if (state.toasts[toast.id]) {
      await dispatch(Dispatch.DismissToast, toast.id);
    }

    toast.timer = setTimeout(async () => {
      await dispatch(Dispatch.DismissToast, toast.id);
    }, 8000);
    commit(Commit.AddToast, toast);
  },
};
