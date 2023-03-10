import { createStore, Store, useStore as vuexUseStore } from 'vuex';

import { actions } from './actions';
import { BTState } from './state';
import { getters } from './getters';
import { mutations } from './mutations';
import { StoreKey } from '@/injection-keys';

export * from './state';
export * from './getters';
export * from './actions';
export * from './mutations';

export default createStore<BTState>({
  state: () => ({
    toasts: {},
  }),
  getters,
  mutations,
  actions,
});

export function useStore(): Store<BTState> {
  return vuexUseStore<BTState>(StoreKey);
}
