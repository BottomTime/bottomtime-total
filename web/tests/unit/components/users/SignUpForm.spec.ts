import { flushPromises, mount } from '@vue/test-utils';
import request, { SuperAgentStatic } from 'superagent';
import { Store } from 'vuex';

import { BTState, createStore } from '@/store';
import { createErrorHandler, ErrorHandlingHOF } from '@/helpers';
import { DefaultUserManager, UserManager } from '@/users';
import SignUpForm from '@/components/users/SignUpForm.vue';
import {
  StoreKey,
  UserManagerKey,
  WithErrorHandlingKey,
} from '@/injection-keys';

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

  it.todo('Will show an error toast if username conflicts');

  it.todo('Will show an error toast if email conflicts');

  it.todo('Will create a new user and sign them in if successful');
});
