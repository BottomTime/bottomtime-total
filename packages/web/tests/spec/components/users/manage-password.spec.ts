import { Fetcher, UserDTO } from '@bottomtime/api';
import { ApiClient, User } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import { ToastType } from '../../../../src/common';
import ManagePassword from '../../../../src/components/users/manage-password.vue';
import { useToasts } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

const PasswordStatus = '[data-testid="password-status"]';
const ChangePassword = '[data-testid="change-password"]';

const OldPasswordInput = '[data-testid="oldPassword"]';
const NewPasswordInput = '[data-testid="newPassword"]';
const ConfirmPasswordInput = '[data-testid="confirmPassword"]';
const SavePassword = '[data-testid="confirm-change-password"]';
const CancelPassword = '[data-testid="cancel-change-password"]';

describe('Manage Password component', () => {
  const OldPassword = '0ldP@ssw0rd';
  const StrongPassword = 'N3wP@ssw0rd!';

  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let user: UserDTO;
  let opts: ComponentMountingOptions<typeof ManagePassword>;

  beforeAll(() => {
    router = createRouter();
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
  });

  beforeEach(() => {
    pinia = createPinia();
    user = { ...BasicUser };

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          teleport: true,
        },
      },
      props: { user },
    };
  });

  it('will show the correct status when the account has a password', () => {
    user.hasPassword = false;
    const wrapper = mount(ManagePassword, opts);
    expect(wrapper.find(PasswordStatus).html()).toMatchSnapshot();
  });

  it('will show the correct status when the account does not have a password', () => {
    user.hasPassword = true;
    const wrapper = mount(ManagePassword, opts);
    expect(wrapper.find(PasswordStatus).html()).toMatchSnapshot();
  });

  it.todo(
    'will allow users to set a password on an account that does not yet have one',
  );

  it('will allow users to change their password', async () => {
    const wrapper = mount(ManagePassword, opts);
    const userObj = new User(fetcher, user);
    const spy = jest.spyOn(userObj, 'changePassword').mockResolvedValue(true);
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(userObj);

    await wrapper.get(ChangePassword).trigger('click');
    await wrapper.get(OldPasswordInput).setValue(OldPassword);
    await wrapper.get(NewPasswordInput).setValue(StrongPassword);
    await wrapper.get(ConfirmPasswordInput).setValue(StrongPassword);
    await wrapper.get(SavePassword).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(OldPassword, StrongPassword);
    expect(wrapper.find(SavePassword).exists()).toBe(false);
    expect(wrapper.emitted('change-password')).toEqual([[]]);
  });

  it('will alert the user if their old password was incorrect', async () => {
    const wrapper = mount(ManagePassword, opts);
    const userObj = new User(fetcher, user);
    const spy = jest.spyOn(userObj, 'changePassword').mockResolvedValue(false);
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(userObj);
    const toasts = useToasts(pinia);

    await wrapper.get(ChangePassword).trigger('click');
    await wrapper.get(OldPasswordInput).setValue(OldPassword);
    await wrapper.get(NewPasswordInput).setValue(StrongPassword);
    await wrapper.get(ConfirmPasswordInput).setValue(StrongPassword);
    await wrapper.get(SavePassword).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(OldPassword, StrongPassword);
    expect(wrapper.find(SavePassword).exists()).toBe(true);
    expect(wrapper.emitted('change-password')).toBeUndefined();
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].type).toBe(ToastType.Error);
    expect(toasts.toasts[0].message).toMatchSnapshot();
  });

  it('will allow users to cancel out of the dialog', async () => {
    const wrapper = mount(ManagePassword, opts);
    await wrapper.get(ChangePassword).trigger('click');
    expect(wrapper.find(OldPasswordInput).isVisible()).toBe(true);
    await wrapper.get(CancelPassword).trigger('click');
    expect(wrapper.find(OldPasswordInput).exists()).toBe(false);
  });

  it('will allow admins to reset a password', async () => {
    opts.props!.admin = true;
    const wrapper = mount(ManagePassword, opts);
    const userObj = new User(fetcher, user);
    const spy = jest.spyOn(userObj, 'resetPassword').mockResolvedValue();
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(userObj);

    await wrapper.get(ChangePassword).trigger('click');
    expect(wrapper.find(OldPasswordInput).exists()).toBe(false);

    await wrapper.get(NewPasswordInput).setValue(StrongPassword);
    await wrapper.get(ConfirmPasswordInput).setValue(StrongPassword);
    await wrapper.get(SavePassword).trigger('click');
    await flushPromises();

    expect(wrapper.find(SavePassword).exists()).toBe(false);
    expect(spy).toHaveBeenCalledWith(StrongPassword);
    expect(wrapper.emitted('change-password')).toEqual([[]]);
  });
});
