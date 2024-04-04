/* eslint-disable vue/one-component-per-file */
import { ApiClient, User, UserDTO, UserRole } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
  shallowMount,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { Pinia, createPinia } from 'pinia';
import { defineComponent } from 'vue';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import ManageUserAccount from '../../../../src/components/admin/manage-user-account.vue';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

dayjs.extend(relativeTime);
dayjs.extend(utc);

const ToggleAccountLock = '[data-testid="toggle-account-lock"]';
const DialogConfirm = '[data-testid="dialog-confirm-button"]';
const DialogCancel = '[data-testid="dialog-cancel-button"]';

const ChangeRole = '[data-testid="change-role"]';
const RoleSelect = '[data-testid="role-select"]';
const ConfirmRole = '[data-testid="confirm-role"]';
const CancelRole = '[data-testid="cancel-role"]';

const MockUsernameAndEmail = defineComponent({
  changeEmail: function (email: string) {
    this.$emit('change-email', email);
  },

  changeUsername: function (username: string) {
    this.$emit('change-username', username);
  },
  emits: ['change-email', 'change-username'],
  expose: ['changeEmail', 'changeUsername'],
  template: '<div></div>',
});

const MockManagePassword = defineComponent({
  changePassword: function () {
    this.$emit('change-password');
  },
  emits: ['change-password'],
  expose: ['changePassword'],
  template: '<div></div>',
});

describe('Manage User Account component', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let userData: UserDTO;
  let opts: ComponentMountingOptions<typeof ManageUserAccount>;

  beforeAll(() => {
    router = createRouter();
    client = new ApiClient();

    jest.useFakeTimers({
      now: new Date('2024-02-14T16:27:57.383Z'),
      doNotFake: ['setImmediate', 'nextTick'],
    });
  });

  beforeEach(() => {
    pinia = createPinia();
    userData = { ...BasicUser };
    opts = {
      props: { user: userData },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will display timestamps with fuzzy dates', () => {
    const wrapper = mount(ManageUserAccount, opts);
    expect(
      wrapper.get('[data-testid="account-timestamps"]').html(),
    ).toMatchSnapshot();
  });

  it('will display timestamps with exact dates', async () => {
    const wrapper = mount(ManageUserAccount, opts);
    await wrapper.get('[data-testid="toggle-fuzzy-timestamps"]').setValue(true);
    await flushPromises();
    expect(
      wrapper.get('[data-testid="account-timestamps"]').html(),
    ).toMatchSnapshot();
  });

  it('will allow an admin to toggle an account lock', async () => {
    const user = new User(client.axios, userData);
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(user);
    const spy = jest.spyOn(user, 'toggleAccountLock').mockResolvedValue();
    const wrapper = mount(ManageUserAccount, opts);

    await wrapper.get(ToggleAccountLock).trigger('click');
    await wrapper.get(DialogConfirm).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalled();
    expect(wrapper.emitted('account-lock-toggled')).toEqual([[userData.id]]);
  });

  it('will allow an admin to cancel an account lock toggle', async () => {
    const user = new User(client.axios, userData);
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(user);
    const spy = jest.spyOn(user, 'toggleAccountLock').mockResolvedValue();
    const wrapper = mount(ManageUserAccount, opts);

    await wrapper.get(ToggleAccountLock).trigger('click');
    await wrapper.get(DialogCancel).trigger('click');
    expect(wrapper.find(DialogConfirm).exists()).toBe(false);

    expect(spy).not.toHaveBeenCalled();
    expect(wrapper.emitted('account-lock-toggled')).toBeUndefined();
  });

  [true, false].forEach((locked) => {
    it(`will display correct account lock state when account is ${
      locked ? 'suspended' : 'active'
    }`, async () => {
      userData.isLockedOut = locked;
      const wrapper = mount(ManageUserAccount, opts);
      expect(
        wrapper.get('[data-testid="account-status"]').html(),
      ).toMatchSnapshot();
    });
  });

  [UserRole.User, UserRole.Admin].forEach((role) => {
    it(`will allow an admin to change a user's role to "${role}"`, async () => {
      userData.role = role === UserRole.User ? UserRole.Admin : UserRole.User;
      const user = new User(client.axios, userData);
      jest.spyOn(client.users, 'wrapDTO').mockReturnValue(user);
      const spy = jest.spyOn(user, 'changeRole').mockResolvedValue();
      const wrapper = mount(ManageUserAccount, opts);

      await wrapper.get(ChangeRole).trigger('click');
      await wrapper.get(RoleSelect).setValue(role);
      await wrapper.get(ConfirmRole).trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(role);
      expect(wrapper.emitted('role-changed')).toEqual([[userData.id, role]]);
    });
  });

  it('will allow an admin to cancel a role change', async () => {
    const user = new User(client.axios, userData);
    jest.spyOn(client.users, 'wrapDTO').mockReturnValue(user);
    const spy = jest.spyOn(user, 'changeRole').mockResolvedValue();
    const wrapper = mount(ManageUserAccount, opts);

    await wrapper.get(ChangeRole).trigger('click');
    await wrapper.get(CancelRole).trigger('click');
    await flushPromises();

    expect(wrapper.find(ConfirmRole).exists()).toBe(false);
    expect(wrapper.find(RoleSelect).exists()).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    expect(wrapper.emitted('role-changed')).toBeUndefined();
  });

  it('will propogate an event when username is changed', async () => {
    const username = 'new-username';
    opts.global!.stubs = {
      UsernameAndEmail: MockUsernameAndEmail,
    };
    const wrapper = shallowMount(ManageUserAccount, opts);
    wrapper
      .findComponent(MockUsernameAndEmail)
      .vm.$emit('change-username', username);

    expect(wrapper.emitted('username-changed')).toEqual([
      [userData.id, username],
    ]);
  });

  it('will propogate an event when email is changed', async () => {
    const email = 'newemail@microsoft.com';
    opts.global!.stubs = {
      UsernameAndEmail: MockUsernameAndEmail,
    };
    const wrapper = shallowMount(ManageUserAccount, opts);
    wrapper.findComponent(MockUsernameAndEmail).vm.$emit('change-email', email);

    expect(wrapper.emitted('email-changed')).toEqual([[userData.id, email]]);
  });

  it('will propogate an event when password is changed', async () => {
    opts.global!.stubs = {
      ManagePassword: MockManagePassword,
    };
    const wrapper = shallowMount(ManageUserAccount, opts);
    wrapper.findComponent(MockManagePassword).vm.$emit('change-password');

    expect(wrapper.emitted('password-reset')).toEqual([[userData.id]]);
  });
});
