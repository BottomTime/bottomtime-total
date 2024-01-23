import { CurrentUserDTO } from '@bottomtime/api';
import { BTState, ToastWithTimer } from './state';
import { MutationTree } from 'vuex';

export enum Commit {
  AddToast = 'addToast',
  RemoveToast = 'removeToast',
  CurrentUser = 'setCurrentUser',
}

export const Mutations: MutationTree<BTState> = {
  [Commit.AddToast]: (state: BTState, toast: ToastWithTimer) => {
    if (state.toasts[toast.id]) {
      clearTimeout(state.toasts[toast.id].timer);
    }

    state.toasts[toast.id] = toast;
  },
  [Commit.RemoveToast]: (state: BTState, id: string) => {
    if (state.toasts[id]) {
      clearTimeout(state.toasts[id].timer);
      delete state.toasts[id];
    }
  },
  [Commit.CurrentUser]: (state: BTState, currentUser: CurrentUserDTO) => {
    state.currentUser = currentUser;
  },
} as const;
