import { createStore } from 'vuex';

import { actions } from './actions';
import { BTState } from './state';
import { mutations } from './mutations';

export * from './state';
export * from './actions';
export * from './mutations';

export default createStore<BTState>({
  state: () => ({}),
  getters: {},
  mutations,
  actions,
});
