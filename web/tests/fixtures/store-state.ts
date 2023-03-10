import { BTState } from '@/store';

export function initialStoreState(state?: Partial<BTState>): BTState {
  return {
    toasts: {},
    ...state,
  };
}
