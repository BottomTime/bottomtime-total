import {
  createStore as vuexCreateStore,
  Store,
  useStore as vuexUseStore,
} from 'vuex';

import { actions } from './actions';
import { BTState } from './state';
// import config from '@/config';
import { getters } from './getters';
import { mutations } from './mutations';
import { StoreKey } from '@/injection-keys';

export * from './state';
export * from './getters';
export * from './actions';
export * from './mutations';

export function createStore(initState?: BTState): Store<BTState> {
  return vuexCreateStore<BTState>({
    state: () => {
      return (
        initState ?? {
          toasts: {},
        }
      );
    },
    getters,
    mutations,
    actions,
    // strict: !config.isProduction,
  });
}

export function useStore(): Store<BTState> {
  return vuexUseStore<BTState>(StoreKey);
}
