import { UserDTO } from '@bottomtime/api';

import { ApiClient, ApiClientKey, User } from '@/client';
import { ToastType } from '@/common';
import UsernameAndEmail from '@/components/users/username-and-email.vue';
import { useToasts } from '@/store';
import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { createAxiosError } from '../../../fixtures/create-axios-error';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

const UsernameInput = '[data-testid="username"]';
const UsernameValue = '[data-testid="username-value"]';
const EditUsername = '[data-testid="edit-username"]';
const SaveUsername = '[data-testid="save-username"]';
const CancelUsername = '[data-testid="cancel-username"]';
const UsernameError = '[data-testid="username-error"]';

const EmailInput = '[data-testid="email"]';
const EmailValue = '[data-testid="email-value"]';
const EditEmail = '[data-testid="edit-email"]';
const SaveEmail = '[data-testid="save-email"]';
const CancelEmail = '[data-testid="cancel-email"]';
const EmailError = '[data-testid="email-error"]';

const EmailVerificationStatus = '[data-testid="email-verification-status"]';
const SendVerificationEmail = '[data-testid="send-verification-email"]';

describe('Username and Email component', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof UsernameAndEmail>;
  let user: UserDTO;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    user = {
      ...BasicUser,
    };

    opts = {
      props: {
        user,
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will allow editing username', async () => {
    const username = 'new.user123';
    const wrapper = mount(UsernameAndEmail, opts);
    const userObject = new User(client.axios, user);
    const spy = jest.spyOn(userObject, 'changeUsername').mockResolvedValue();
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(userObject);

    expect(wrapper.get(UsernameValue).text()).toBe(user.username);
    await wrapper.get(EditUsername).trigger('click');

    expect(wrapper.find(UsernameValue).exists()).toBe(false);
    await wrapper.get(UsernameInput).setValue(username);
    await wrapper.get(SaveUsername).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(username);
    expect(wrapper.emitted('change-username')).toEqual([[username]]);
    expect(wrapper.find(UsernameInput).exists()).toBe(false);
    expect(wrapper.get(UsernameValue).isVisible()).toBe(true);
  });

  it('will fail validation if username is not entered', async () => {
    const wrapper = mount(UsernameAndEmail, opts);
    const spy = jest.spyOn(client.users, 'wrapDTO');

    await wrapper.get(EditUsername).trigger('click');
    await wrapper.get(UsernameInput).setValue('');
    await wrapper.get(SaveUsername).trigger('click');
    await flushPromises();

    expect(wrapper.get(UsernameError).text()).toBe('New username is required');
    expect(wrapper.find(UsernameInput).isVisible()).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('will fail validation if username is invalid', async () => {
    const wrapper = mount(UsernameAndEmail, opts);
    const spy = jest.spyOn(client.users, 'wrapDTO');

    await wrapper.get(EditUsername).trigger('click');
    await wrapper.get(UsernameInput).setValue('nope!!');
    await wrapper.get(SaveUsername).trigger('click');
    await flushPromises();

    expect(wrapper.get(UsernameError).text()).toBe(
      'Username must be at least 3 characters and contain only letters, numbers, dashes, dots, and underscores',
    );
    expect(wrapper.find(UsernameInput).isVisible()).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('will allow cancelling username edit', async () => {
    const wrapper = mount(UsernameAndEmail, opts);

    await wrapper.get(EditUsername).trigger('click');
    await wrapper.get(UsernameInput).setValue('new.user123');
    await wrapper.get(CancelUsername).trigger('click');

    expect(wrapper.find(UsernameInput).exists()).toBe(false);
    expect(wrapper.get(UsernameValue).isVisible()).toBe(true);

    await wrapper.get(EditUsername).trigger('click');
    expect(wrapper.get<HTMLInputElement>(UsernameInput).element.value).toBe(
      user.username,
    );
  });

  it('will show an error if the username is taken', async () => {
    const username = 'new.user123';
    const message = 'Username is already taken';
    const wrapper = mount(UsernameAndEmail, opts);
    const userObject = new User(client.axios, user);
    const spy = jest.spyOn(userObject, 'changeUsername').mockRejectedValue(
      createAxiosError({
        status: 409,
        message,
        path: '/api/users/',
        method: 'POST',
      }),
    );
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(userObject);
    const toasts = useToasts(pinia);

    await wrapper.get(EditUsername).trigger('click');
    await wrapper.get(UsernameInput).setValue(username);
    await wrapper.get(SaveUsername).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(username);
    expect(wrapper.find(UsernameInput).isVisible()).toBe(true);
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].message).toBe(
      'The username you entered is already in use. Please try another.',
    );
    expect(toasts.toasts[0].type).toBe(ToastType.Error);
  });

  it('will allow editing email', async () => {
    const email = 'new_email@whodis.org';
    const wrapper = mount(UsernameAndEmail, opts);
    const userObject = new User(client.axios, user);
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(userObject);
    const spy = jest.spyOn(userObject, 'changeEmail').mockResolvedValue();

    expect(wrapper.get(EmailValue).text()).toBe(user.email);
    await wrapper.get(EditEmail).trigger('click');

    expect(wrapper.find(EmailValue).exists()).toBe(false);
    await wrapper.get(EmailInput).setValue(email);
    await wrapper.get(SaveEmail).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(email);
    expect(wrapper.emitted('change-email')).toEqual([[email]]);
    expect(wrapper.find(EmailInput).exists()).toBe(false);
    expect(wrapper.get(EmailValue).isVisible()).toBe(true);
  });

  it('will fail validation if email is not entered', async () => {
    const wrapper = mount(UsernameAndEmail, opts);
    const spy = jest.spyOn(client.users, 'wrapDTO');

    await wrapper.get(EditEmail).trigger('click');
    await wrapper.get(EmailInput).setValue('');
    await wrapper.get(SaveEmail).trigger('click');
    await flushPromises();

    expect(wrapper.get(EmailError).text()).toBe(
      'New email address is required',
    );
    expect(wrapper.find(EmailInput).isVisible()).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('will fail validation if email is invalid', async () => {
    const wrapper = mount(UsernameAndEmail, opts);
    const spy = jest.spyOn(client.users, 'wrapDTO');

    await wrapper.get(EditEmail).trigger('click');
    await wrapper.get(EmailInput).setValue('nope');
    await wrapper.get(SaveEmail).trigger('click');
    await flushPromises();

    expect(wrapper.get(EmailError).text()).toBe(
      'Must be a valid email address',
    );
    expect(wrapper.find(EmailInput).isVisible()).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('will allow cancelling email edit', async () => {
    const wrapper = mount(UsernameAndEmail, opts);

    await wrapper.get(EditEmail).trigger('click');
    await wrapper.get(EmailInput).setValue('greatestemail@email.com');
    await wrapper.get(CancelEmail).trigger('click');

    expect(wrapper.find(EmailInput).exists()).toBe(false);
    expect(wrapper.get(EmailValue).isVisible()).toBe(true);

    await wrapper.get(EditEmail).trigger('click');
    expect(wrapper.get<HTMLInputElement>(EmailInput).element.value).toBe(
      user.email,
    );
  });

  it('will show an error if the email is taken', async () => {
    const email = 'greg@greg.net';
    const message = 'Email is already taken';
    const wrapper = mount(UsernameAndEmail, opts);
    const userObject = new User(client.axios, user);
    const spy = jest.spyOn(userObject, 'changeEmail').mockRejectedValue(
      createAxiosError({
        status: 409,
        message,
        path: '/api/users/',
        method: 'POST',
      }),
    );
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(userObject);
    const toasts = useToasts(pinia);

    await wrapper.get(EditEmail).trigger('click');
    await wrapper.get(EmailInput).setValue(email);
    await wrapper.get(SaveEmail).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(email);
    expect(wrapper.find(EmailInput).isVisible()).toBe(true);
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].message).toBe(
      'The email address you entered is already in use. Please try another.',
    );
    expect(toasts.toasts[0].type).toBe(ToastType.Error);
  });

  it('will indicate if an email is unverified', async () => {
    user.emailVerified = false;
    const wrapper = mount(UsernameAndEmail, opts);
    expect(wrapper.get(EmailVerificationStatus).html()).toMatchSnapshot();
    expect(wrapper.get(SendVerificationEmail).isVisible()).toBe(true);
  });

  it('will indicate if an email is verified', async () => {
    user.emailVerified = true;
    const wrapper = mount(UsernameAndEmail, opts);
    expect(wrapper.get(EmailVerificationStatus).html()).toMatchSnapshot();
    expect(wrapper.find(SendVerificationEmail).exists()).toBe(false);
  });

  it('will send a verification email upon request', async () => {
    user.emailVerified = false;
    const wrapper = mount(UsernameAndEmail, opts);
    const userObject = new User(client.axios, user);
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(userObject);
    const spy = jest
      .spyOn(userObject, 'requestEmailVerification')
      .mockResolvedValue();

    await wrapper.get(SendVerificationEmail).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalled();
    expect(wrapper.find(SendVerificationEmail).exists()).toBe(false);
    expect(wrapper.get(EmailVerificationStatus).html()).toMatchSnapshot();
  });
});
