import {
  AccountTier,
  ErrorResponseDTO,
  Fetcher,
  LogBookSharing,
  UserDTO,
  UserRole,
} from '@bottomtime/api';
import { ApiClient } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { defineComponent } from 'vue';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import { ToastType } from '../../../../src/common';
import RegisterForm from '../../../../src/components/users/register-form.vue';
import { useToasts } from '../../../../src/store';
import { useCurrentUser } from '../../../../src/store/current-user.store';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

const Username = '[data-testid="username"]';
const UsernameError = '[data-testid="username-error"]';
const Email = '[data-testid="email"]';
const EmailError = '[data-testid="email-error"]';
const Password = '[data-testid="password"]';
const PasswordError = '[data-testid="password-error"]';
const ConfirmPassword = '[data-testid="confirm-password"]';
const ConfirmPasswordError = '[data-testid="confirm-password-error"]';
const DisplayName = '[data-testid="display-name"]';
const Location = '[data-testid="location"]';
const SubmitButton = '[data-testid="register-submit"]';

const NewUser: UserDTO = {
  id: 'BA9E78C9-4B0F-4FAE-B011-96A91986ABCD',
  accountTier: AccountTier.Basic,
  username: 'john_doe32',
  email: 'user_mcuserson@yahoo.com',
  emailVerified: false,
  hasPassword: true,
  isLockedOut: false,
  memberSince: Date.now(),
  role: UserRole.User,
  profile: {
    accountTier: AccountTier.Basic,
    memberSince: Date.now(),
    username: 'john_doe32',
    name: 'John Doe',
    logBookSharing: LogBookSharing.Public,
    location: 'Nowhereville, QC',
    userId: 'BA9E78C9-4B0F-4FAE-B011-96A91986ABCD',
  },
  settings: {
    ...BasicUser.settings,
  },
} as const;

describe('Registration form', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let pinia: Pinia;
  let global: ComponentMountingOptions<unknown>['global'];

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter([
      {
        path: '/welcome',
        name: 'welcome',
        component: defineComponent({
          template: '<div>Welcome!</div>',
        }),
      },
    ]);
  });

  beforeEach(() => {
    pinia = createPinia();
    global = {
      plugins: [pinia, router],
      provide: {
        [ApiClientKey as symbol]: client,
      },
    };
  });

  it('will fail validation on required fields', async () => {
    const wrapper = mount(RegisterForm, { global });

    await wrapper.get(SubmitButton).trigger('click');
    await flushPromises();

    const usernameError = wrapper.find(UsernameError);
    expect(usernameError.isVisible()).toBe(true);
    expect(usernameError.text()).toBe('Username is required');

    const emailError = wrapper.find(EmailError);
    expect(emailError.isVisible()).toBe(true);
    expect(emailError.text()).toBe('Email address is required');

    const passwordError = wrapper.find(PasswordError);
    expect(passwordError.isVisible()).toBe(true);
    expect(passwordError.text()).toBe('Password is required');

    const confirmPasswordError = wrapper.find(ConfirmPasswordError);
    expect(confirmPasswordError.isVisible()).toBe(true);
    expect(confirmPasswordError.text()).toBe(
      'Password confirmation is required',
    );
  });

  it('will fail validation if username is invalid', async () => {
    jest
      .spyOn(client.userAccounts, 'isUsernameOrEmailAvailable')
      .mockResolvedValue(true);
    const wrapper = mount(RegisterForm, { global });

    await wrapper.get(Username).setValue('**NOPE**');
    await wrapper.get(SubmitButton).trigger('click');
    await flushPromises();

    const usernameError = wrapper.find(UsernameError);
    expect(usernameError.isVisible()).toBe(true);
    expect(usernameError.text()).toBe(
      'Username must contain only letters, numbers, underscores, dots, and dashes',
    );
  });

  it('will fail validation if username is taken', async () => {
    jest
      .spyOn(client.userAccounts, 'isUsernameOrEmailAvailable')
      .mockResolvedValue(false);
    const wrapper = mount(RegisterForm, { global });

    await wrapper.get(Username).setValue('taken123');
    await wrapper.get(SubmitButton).trigger('click');
    await flushPromises();

    const usernameError = wrapper.find(UsernameError);
    expect(usernameError.isVisible()).toBe(true);
    expect(usernameError.text()).toBe('Username is already taken');
  });

  it('will fail validation if email is invalid', async () => {
    jest
      .spyOn(client.userAccounts, 'isUsernameOrEmailAvailable')
      .mockResolvedValue(true);
    const wrapper = mount(RegisterForm, { global });

    await wrapper.get(Email).setValue('not-an-email');
    await wrapper.get(SubmitButton).trigger('click');
    await flushPromises();

    const emailError = wrapper.find(EmailError);
    expect(emailError.isVisible()).toBe(true);
    expect(emailError.text()).toBe(
      'Must be a valid email address (e.g. address@server.org)',
    );
  });

  it('will fail validation if email is taken', async () => {
    jest
      .spyOn(client.userAccounts, 'isUsernameOrEmailAvailable')
      .mockResolvedValue(false);
    const wrapper = mount(RegisterForm, { global });

    await wrapper.get(Email).setValue('taken@gmail.com');
    await wrapper.get(SubmitButton).trigger('click');
    await flushPromises();

    const emailError = wrapper.find(EmailError);
    expect(emailError.isVisible()).toBe(true);
    expect(emailError.text()).toBe('Email address is already in use');
  });

  it('will fail validation if password is too weak', async () => {
    jest
      .spyOn(client.userAccounts, 'isUsernameOrEmailAvailable')
      .mockResolvedValue(true);
    const wrapper = mount(RegisterForm, { global });

    await wrapper.get(Password).setValue('weak');
    await wrapper.get(SubmitButton).trigger('click');
    await flushPromises();

    const passwordError = wrapper.find(PasswordError);
    expect(passwordError.isVisible()).toBe(true);
    expect(passwordError.text()).toBe(
      'Password must meet strength requirements',
    );
  });

  it('will fail validation if passwords do not match', async () => {
    jest
      .spyOn(client.userAccounts, 'isUsernameOrEmailAvailable')
      .mockResolvedValue(true);
    const wrapper = mount(RegisterForm, { global });

    await wrapper.get(Password).setValue('StrongPassword123');
    await wrapper.get(ConfirmPassword).setValue('NotTheSame');
    await wrapper.get(SubmitButton).trigger('click');
    await flushPromises();

    const confirmPasswordError = wrapper.find(ConfirmPasswordError);
    expect(confirmPasswordError.isVisible()).toBe(true);
    expect(confirmPasswordError.text()).toBe('Passwords do not match');
  });

  // This is **really** an edge case but we'll test for it anyway.
  it('will show a conflict error if the username or email is taken', async () => {
    const password = 'StrongP@ssword123';
    const message = 'Nope. Username taken.';
    const errorResponse: ErrorResponseDTO = {
      message,
      status: 409,
      method: 'POST',
      path: '/api/users',
    };
    jest
      .spyOn(client.userAccounts, 'isUsernameOrEmailAvailable')
      .mockResolvedValue(true);
    const spy = jest
      .spyOn(client.userAccounts, 'createUser')
      .mockRejectedValue(createHttpError(errorResponse));

    const wrapper = mount(RegisterForm, { global });

    await wrapper.get(Username).setValue(NewUser.username);
    await wrapper.get(Email).setValue(NewUser.email);
    await wrapper.get(Password).setValue(password);
    await wrapper.get(ConfirmPassword).setValue(password);
    await wrapper.get(SubmitButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      email: NewUser.email,
      password,
      profile: {
        location: '',
        name: '',
      },
      username: NewUser.username,
    });
    const toasts = useToasts(pinia).toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].id).toBe('username-or-email-conflict');
    expect(toasts[0].message).toBe(message);
    expect(toasts[0].type).toBe(ToastType.Error);
  });

  it('will create a new user and sign them in', async () => {
    const password = 'StrongP@ssword123';
    jest
      .spyOn(client.userAccounts, 'isUsernameOrEmailAvailable')
      .mockResolvedValue(true);
    const createSpy = jest
      .spyOn(client.userAccounts, 'createUser')
      .mockResolvedValue(NewUser);
    const loginSpy = jest
      .spyOn(client.auth, 'login')
      .mockResolvedValue(NewUser);

    const wrapper = mount(RegisterForm, { global });
    const currentUser = useCurrentUser(pinia);

    await wrapper.get(Username).setValue(NewUser.username);
    await wrapper.get(Email).setValue(NewUser.email);
    await wrapper.get(Password).setValue(password);
    await wrapper.get(ConfirmPassword).setValue(password);
    await wrapper.get(DisplayName).setValue(NewUser.profile.name);
    await wrapper.get(Location).setValue(NewUser.profile.location);

    await wrapper.get(SubmitButton).trigger('click');
    await flushPromises();

    expect(createSpy).toHaveBeenCalledWith({
      email: NewUser.email,
      password,
      profile: {
        location: NewUser.profile.location,
        name: NewUser.profile.name,
      },
      username: NewUser.username,
    });
    expect(loginSpy).toHaveBeenCalledWith(NewUser.username, password);
    expect(currentUser.user).toEqual(NewUser);
    expect(router.currentRoute.value.fullPath).toBe('/welcome');
  });
});
