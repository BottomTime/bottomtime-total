import { GetterTree } from 'vuex';
import { BTState } from './state';
import { Toast } from '@/helpers';

export const getters: GetterTree<BTState, BTState> = {
  toasts(state): Toast[] {
    return Object.values(state.toasts);
  },

  userDisplayName(state): string | undefined {
    return state.currentUser?.profile.name ?? state.currentUser?.username;
  },
};
