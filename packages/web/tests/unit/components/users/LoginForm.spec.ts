import { flushPromises, mount } from '@vue/test-utils';
import request, { SuperAgentStatic } from 'superagent';

import { BTState, createStore } from '@/store';
import { createErrorHandler, ErrorHandlingHOF } from '@/helpers';
import { createHttpError } from '../../../fixtures/create-http-error';
import { DefaultUser, DefaultUserManager, UserManager } from '@/users';
import { fakeUser } from '../../..//fixtures/fake-user';
import LoginForm from '@/components/users/LoginForm.vue';
import { Store } from 'vuex';
import {
  StoreKey,
  UserManagerKey,
  WithErrorHandlingKey,
} from '@/injection-keys';

describe('Login Form', () => {
  let agent: SuperAgentStatic;
  let withErrorHandling: ErrorHandlingHOF;
  let userManager: UserManager;
  let store: Store<BTState>;

  beforeAll(() => {
    agent = request.agent();
    userManager = new DefaultUserManager(agent);
    store = createStore();
    withErrorHandling = createErrorHandler(store);
  });

  it('Will validate that username and password are entered', async () => {
    const wrapper = mount(LoginForm, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [UserManagerKey as symbol]: userManager,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    const authenticateSpy = jest.spyOn(userManager, 'authenticateUser');

    await wrapper.get('button#btn-login').trigger('click');
    await flushPromises();

    expect(authenticateSpy).not.toBeCalled();
    expect(
      wrapper.find('span#err-usernameOrEmail-required').text(),
    ).toMatchSnapshot();
    expect(wrapper.find('span#err-password-required').text()).toMatchSnapshot();
  });

  it('Will show an error toast if authentication fails', async () => {
    const error = createHttpError(401);
    const username = 'tom23';
    const password = 'P@ssw3rd.';
    const wrapper = mount(LoginForm, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [UserManagerKey as symbol]: userManager,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    const authenticateSpy = jest
      .spyOn(userManager, 'authenticateUser')
      .mockRejectedValue(error);
    const dispatchSpy = jest
      .spyOn(store, 'dispatch')
      .mockResolvedValue(undefined);

    await wrapper.get('input#usernameOrEmail').setValue(username);
    await wrapper.get('input#password').setValue(password);
    await wrapper.get('button#btn-login').trigger('click');
    await flushPromises();

    expect(authenticateSpy).toBeCalledWith(username, password);
    expect(dispatchSpy).toBeCalled();
    expect(dispatchSpy.mock.lastCall).toMatchSnapshot();

    expect(
      (wrapper.get('input#password').element as HTMLInputElement).value,
    ).toHaveLength(0);
  });

  it('Will authenticate a user', async () => {
    const userData = fakeUser();
    const user = new DefaultUser(agent, userData);
    const username = user.username;
    const password = 'P@ssw3rd.';
    const wrapper = mount(LoginForm, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [UserManagerKey as symbol]: userManager,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    const authenticateSpy = jest
      .spyOn(userManager, 'authenticateUser')
      .mockResolvedValue(user);
    const dispatchSpy = jest
      .spyOn(store, 'dispatch')
      .mockResolvedValue(undefined);

    await wrapper.get('input#usernameOrEmail').setValue(username);
    await wrapper.get('input#password').setValue(password);
    await wrapper.get('button#btn-login').trigger('click');
    await flushPromises();

    expect(authenticateSpy).toBeCalledWith(username, password);
    expect(dispatchSpy).toBeCalled();
    expect(dispatchSpy.mock.lastCall).toEqual(['signInUser', user]);
  });
});
