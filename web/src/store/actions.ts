import { ActionTree } from 'vuex';
import { BTState } from './state';
import { User } from '@/users';
import { Commit } from './mutations';

export const Dispatch = {
  SignInUser: 'signInUser',
  SignOutUser: 'signOutUser',
} as const;

export const actions: ActionTree<BTState, BTState> = {
  [Dispatch.SignInUser]: ({ commit }, user: User) => {
    commit(Commit.SetCurrentUser, user);
  },

  [Dispatch.SignOutUser]: ({ commit }) => {
    commit(Commit.SetCurrentUser, undefined);
  },
};
