import { flushPromises, mount } from '@vue/test-utils';
import request, { SuperAgentStatic } from 'superagent';

import { BTState, createStore } from '@/store';
import { createErrorHandler, ErrorHandlingHOF } from '@/helpers';
import { createHttpError } from '../../../fixtures/create-http-error';
import { DefaultUser, DefaultUserManager, UserManager } from '@/client/users';
import { fakeUser } from '../../..//fixtures/fake-user';
import LoginForm from '@/components/users/LoginForm.vue';
import { Store } from 'vuex';
import { ApiClientKey, StoreKey, WithErrorHandlingKey } from '@/injection-keys';
import { ApiClient } from '@/client';
import { SuperAgentClient } from '@/client/superagent-client';

describe('Login Form', () => {
  let agent: SuperAgentStatic;
  let apiClient: ApiClient;
  let withErrorHandling: ErrorHandlingHOF;
  let store: Store<BTState>;

  beforeAll(() => {
    agent = request.agent();
    apiClient = new SuperAgentClient(agent);
    store = createStore();
    withErrorHandling = createErrorHandler(store);
  });

  it('Will validate that username and password are entered', async () => {
    const wrapper = mount(LoginForm, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    const authenticateSpy = jest.spyOn(apiClient.users, 'authenticateUser');

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
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    const authenticateSpy = jest
      .spyOn(apiClient.users, 'authenticateUser')
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
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    const authenticateSpy = jest
      .spyOn(apiClient.users, 'authenticateUser')
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
