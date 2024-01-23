import { InjectionKey } from 'vue';
import {
  createStore as createStoreVuex,
  Store,
  useStore as useStoreVuex,
} from 'vuex';
import { Actions } from './actions';
import { BTState } from './state';
import { Config } from '../config';
import { Mutations } from './mutations';

export const BTStoreKey: InjectionKey<Store<BTState>> = Symbol('BTStore');

export function useStore(): Store<BTState> {
  return useStoreVuex(BTStoreKey);
}

export function createStore(initial?: Partial<BTState>): Store<BTState> {
  return createStoreVuex<BTState>({
    state: () => ({
      currentUser: initial?.currentUser ?? { anonymous: true },
      toasts: initial?.toasts ?? {},
    }),
    actions: Actions,
    mutations: Mutations,
    strict: Config.isProduction,
  });
}

export * from './state';
export { Commit } from './mutations';
export { Dispatch } from './actions';
