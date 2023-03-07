import { ToastType } from '@/helpers';
import { BTState, getters } from '@/store';

function createDefaultState(): BTState {
  return {
    toasts: {},
  };
}

describe('Store Getters', () => {
  it('Will return an array of toasts', () => {
    const state = createDefaultState();
    state.toasts = {
      'server-error': {
        id: 'server-error',
        type: ToastType.Error,
        message: 'Did not work',
      },
      'save-success': {
        id: 'save-success',
        type: ToastType.Success,
        message: 'Your widget was successfully saved.',
      },
    };

    expect(getters.toasts(state, {}, state, {})).toEqual([
      state.toasts['server-error'],
      state.toasts['save-success'],
    ]);
  });
});
