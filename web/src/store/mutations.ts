import { User } from '@/users';
import { MutationTree } from 'vuex';
import { BTState } from './state';

export const Commit = {
  SetCurrentUser: 'setCurrentUser',
} as const;

export const mutations: MutationTree<BTState> = {
  [Commit.SetCurrentUser]: (state, currentUser: User | undefined) => {
    state.currentUser = currentUser;
  },
};
