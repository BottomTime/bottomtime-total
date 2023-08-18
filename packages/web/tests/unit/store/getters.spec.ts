import request from 'superagent';
import { ToastType } from '@/helpers';
import { BTState, getters } from '@/store';
import { fakeUser } from '../../fixtures/fake-user';
import { DefaultUser } from '@/client/users';

function createDefaultState(state?: Partial<BTState>): BTState {
  return {
    currentUser: state?.currentUser,
    toasts: state?.toasts ?? {},
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

  it('Will return profile name as display name if present', () => {
    const name = 'Jimmy L.';
    const currentUser = new DefaultUser(request.agent(), fakeUser());
    currentUser.profile.name = name;
    const state = createDefaultState({ currentUser });
    expect(getters.userDisplayName(state, {}, state, {})).toEqual(name);
  });

  it('Will return username as display name if no profile name is present', () => {
    const currentUser = new DefaultUser(request.agent(), fakeUser());
    const state = createDefaultState({ currentUser });
    expect(getters.userDisplayName(state, {}, state, {})).toEqual(
      currentUser.username,
    );
  });

  it('Will return undefined if user is not currently logged in', () => {
    const state = createDefaultState();
    expect(getters.userDisplayName(state, {}, state, {})).toBeUndefined();
  });
});
