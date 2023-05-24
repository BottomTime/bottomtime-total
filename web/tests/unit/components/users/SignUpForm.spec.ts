import flushPromises from 'flush-promises';
import { mount } from '@vue/test-utils';
import request, { SuperAgentStatic } from 'superagent';
import router from '@/router';
import { Store } from 'vuex';

import { BTState, createStore } from '@/store';
import { createErrorHandler, ErrorHandlingHOF } from '@/helpers';
import { DefaultUserManager, UserManager } from '@/users';
import { scope } from '../../../utils/scope';
import SignUpForm from '@/components/users/SignUpForm.vue';
import {
  StoreKey,
  UserManagerKey,
  WithErrorHandlingKey,
} from '@/injection-keys';
import { ProfileVisibility } from '@/constants';

describe('Sign Up Form', () => {
  let agent: SuperAgentStatic;
  let store: Store<BTState>;
  let userManager: UserManager;
  let withErrorHandling: ErrorHandlingHOF;

  beforeAll(() => {
    agent = request.agent();
    store = createStore();
    userManager = new DefaultUserManager(agent);
    withErrorHandling = createErrorHandler(store);
  });

  it('Will validate fields', async () => {
    const wrapper = mount(SignUpForm, {
      global: {
        provide: {
          [UserManagerKey as symbol]: userManager,
          [StoreKey as symbol]: store,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });

    const createUserSpy = jest.spyOn(userManager, 'createUser');
    const signupButton = wrapper.get('button#btn-signup');

    await signupButton.trigger('click');
    await flushPromises();
    expect(createUserSpy).not.toBeCalled();

    expect(wrapper.find('span#err-username-required').text()).toMatchSnapshot();
    expect(wrapper.find('span#err-email-required').text()).toMatchSnapshot();
    expect(wrapper.find('span#err-password-required').text()).toMatchSnapshot();
    expect(
      wrapper.find('span#err-confirmPassword-required').text(),
    ).toMatchSnapshot();

    await wrapper.get('input#username').setValue('not valid');
    await wrapper.get('input#email').setValue('not an email');
    await wrapper.get('input#password').setValue('too_weak');
    await wrapper.get('input#confirmPassword').setValue('different');

    await signupButton.trigger('click');
    await flushPromises();
    expect(createUserSpy).not.toBeCalled();

    expect(wrapper.find('span#err-username-username').text()).toMatchSnapshot();
    expect(wrapper.find('span#err-email-email').text()).toMatchSnapshot();
    expect(wrapper.find('span#err-password-strength').text()).toMatchSnapshot();
    expect(
      wrapper.find('span#err-confirmPassword-matches').text(),
    ).toMatchSnapshot();
  });

  it('Will toggle password strength requirements info', async () => {
    const wrapper = mount(SignUpForm, {
      global: {
        provide: {
          [UserManagerKey as symbol]: userManager,
          [StoreKey as symbol]: store,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });

    const toggleButton = wrapper.get('a#btn-toggle-password-help');
    await toggleButton.trigger('click');
    expect(wrapper.find('div#password-help').isVisible()).toBe(true);

    await toggleButton.trigger('click');
    expect(wrapper.find('div#password-help').isVisible()).toBe(false);
  });

  it('Will show an error toast if username conflicts', async () => {
    const username = 'mike27';
    const password = 'f298fGHq093248f^%*^ghq340-h2';
    const wrapper = mount(SignUpForm, {
      global: {
        provide: {
          [UserManagerKey as symbol]: userManager,
          [StoreKey as symbol]: store,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    const dispatch = jest.spyOn(store, 'dispatch').mockResolvedValue(undefined);
    scope.put(`/api/users/${username}`).reply(409, {
      statusCode: 409,
      message:
        'Unable to create user account. Username "mike27" is already taken.',
      httpPath: '/users/mike27',
      httpMethod: 'PUT',
      details: { conflictingField: 'username' },
    });

    await wrapper.get('input#username').setValue(username);
    await wrapper.get('input#email').setValue('mike@email.com');
    await wrapper.get('input#password').setValue(password);
    await wrapper.get('input#confirmPassword').setValue(password);

    await wrapper.vm.submit();
    expect(dispatch).toBeCalledTimes(1);
    expect(dispatch.mock.lastCall).toMatchSnapshot();
  });

  it('Will show an error toast if email conflicts', async () => {
    const username = 'mike27';
    const email = 'mike@gmail.org';
    const password = 'f298fGHq093248f^%*^ghq340-h2';
    const wrapper = mount(SignUpForm, {
      global: {
        provide: {
          [UserManagerKey as symbol]: userManager,
          [StoreKey as symbol]: store,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    const dispatch = jest.spyOn(store, 'dispatch').mockResolvedValue(undefined);
    scope.put(`/api/users/${username}`).reply(409, {
      statusCode: 409,
      message:
        'Unable to create user account. Email address "mike@gmail.org" is already in use.',
      httpPath: '/users/mike27',
      httpMethod: 'PUT',
      details: { conflictingField: 'email' },
    });

    await wrapper.get('input#username').setValue(username);
    await wrapper.get('input#email').setValue(email);
    await wrapper.get('input#password').setValue(password);
    await wrapper.get('input#confirmPassword').setValue(password);

    await wrapper.vm.submit();
    expect(dispatch).toBeCalledTimes(1);
    expect(dispatch.mock.lastCall).toMatchSnapshot();
  });

  it('Will create a new user and sign them in if successful', async () => {
    const username = 'RonnyJ_82';
    const email = 'ronny@gmail.com';
    const password = '(H*(*H982nijef2008390ujdo)*[';
    const name = 'Ron Haskinks';
    const location = 'Vancouver, CA';

    const wrapper = mount(SignUpForm, {
      global: {
        provide: {
          [UserManagerKey as symbol]: userManager,
          [StoreKey as symbol]: store,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });

    const dispatch = jest.spyOn(store, 'dispatch').mockResolvedValue(undefined);
    const push = jest.spyOn(router, 'push');
    scope
      .put(`/api/users/${username}`, {
        email,
        password,
        profile: {
          name,
          location,
          profileVisibility: 'private',
        },
      })
      .reply(201, {
        id: 'fa4fc9f5-f33c-47a9-85ee-079d6cf26524',
        username: 'RonnyJ_82',
        email: 'ronny@gmail.com',
        emailVerified: false,
        hasPassword: true,
        lastLogin: '2023-04-03T21:57:52.420Z',
        isLockedOut: false,
        memberSince: '2023-04-03T21:57:50.591Z',
        profile: {
          userId: 'fa4fc9f5-f33c-47a9-85ee-079d6cf26524',
          username: 'RonnyJ_82',
          memberSince: '2023-04-03T21:57:50.591Z',
          profileVisibility: 'private',
        },
        role: 100,
      });

    await wrapper.get('input#username').setValue(username);
    await wrapper.get('input#email').setValue(email);
    await wrapper.get('input#password').setValue(password);
    await wrapper.get('input#confirmPassword').setValue(password);
    await wrapper.get('input#name').setValue(name);
    await wrapper
      .get('select#profileVisibility')
      .setValue(ProfileVisibility.Private);
    await wrapper.get('input#location').setValue(location);

    await wrapper.vm.submit();

    expect(scope.isDone()).toBe(true);
    expect(dispatch.mock.calls).toMatchSnapshot();
    expect(push).toBeCalledWith('/');
  });
});
