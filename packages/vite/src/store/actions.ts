import { ActionTree } from 'vuex';
import { BTState } from './state';
import { Toast } from '../common';
import { Commit } from './mutations';

export enum Dispatch {
  Toast = 'toast',
  DismissToast = 'dismissToast',
}

export const Actions: ActionTree<BTState, BTState> = {
  [Dispatch.Toast]: ({ commit }, toast: Toast) => {
    commit(Commit.AddToast, {
      ...toast,
      timer: setTimeout(() => commit(Commit.RemoveToast, toast.id), 3000),
    });
  },
  [Dispatch.DismissToast]: ({ commit }, id: string) => {
    commit(Commit.RemoveToast, id);
  },
} as const;
