import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserDTO,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { mount } from '@vue/test-utils';

import axios from 'axios';
import AxiosAdapter from 'axios-mock-adapter';
import flushPromises from 'flush-promises';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClient, ApiClientKey } from '../../../../src/client';
import LoginForm from '../../../../src/components/users/login-form.vue';
import { useCurrentUser, useToasts } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';

const UserData: UserDTO = {
  id: 'B8D70E2C-BEA3-4F21-9EEB-42A4AA79F706',
  email: 'jbard_dives@gmail.com',
  emailVerified: true,
  hasPassword: true,
  isLockedOut: false,
  lastLogin: new Date('2021-08-01T00:00:00.000Z'),
  lastPasswordChange: new Date('2021-08-01T00:00:00.000Z'),
  memberSince: new Date('2021-08-01T00:00:00.000Z'),
  role: UserRole.User,
  username: 'j.bard43',
  profile: {
    userId: 'B8D70E2C-BEA3-4F21-9EEB-42A4AA79F706',
    username: 'j.bard43',
    memberSince: new Date('2021-08-01T00:00:00.000Z'),
    name: 'John Bard',
  },
  settings: {
    depthUnit: DepthUnit.Meters,
    pressureUnit: PressureUnit.Bar,
    temperatureUnit: TemperatureUnit.Celsius,
    profileVisibility: ProfileVisibility.Public,
    weightUnit: WeightUnit.Kilograms,
  },
};

describe('Login Form component', () => {
  let pinia: Pinia;
  let router: Router;
  let client: ApiClient;
  let axiosAdapter: AxiosAdapter;

  beforeAll(() => {
    axiosAdapter = new AxiosAdapter(axios);
  });

  beforeEach(() => {
    pinia = createPinia();
    router = createRouter();
    client = new ApiClient();
  });

  afterEach(() => {
    axiosAdapter.reset();
  });

  it('will validate missing fields', async () => {
    const wrapper = mount(LoginForm, {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    });
    await wrapper.find('[data-testid="login-submit"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="username-error"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="password-error"]').isVisible()).toBe(
      true,
    );
  });

  it('will login a user', async () => {
    const usernameOrEmail = UserData.username;
    const password = 'S3cret!';
    const currentUser = useCurrentUser(pinia);
    const wrapper = mount(LoginForm, {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    });
    axiosAdapter.onPost('/api/auth/login').reply(200, UserData);

    await wrapper
      .find('[data-testid="login-username"]')
      .setValue(usernameOrEmail);
    await wrapper.find('[data-testid="login-password"]').setValue(password);

    await wrapper.find('[data-testid="login-submit"]').trigger('click');
    await flushPromises();

    expect(currentUser.displayName).toEqual(UserData.profile.name);
  });

  it('will show an error toast when user fails login', async () => {
    const usernameOrEmail = UserData.username;
    const password = 'wrong';
    const currentUser = useCurrentUser(pinia);
    const toasts = useToasts(pinia);
    const wrapper = mount(LoginForm, {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    });
    axiosAdapter.onPost('/api/auth/login').reply(401);

    await wrapper
      .find('[data-testid="login-username"]')
      .setValue(usernameOrEmail);
    await wrapper.find('[data-testid="login-password"]').setValue(password);

    await wrapper.find('[data-testid="login-submit"]').trigger('click');
    await flushPromises();

    expect(currentUser.user).toBeNull();
    expect(toasts.toasts[0]?.id).toEqual('login-attempt-failed');
  });

  it('will allow form resets', async () => {
    const wrapper = mount(LoginForm, {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    });

    await wrapper.find('[data-testid="login-username"]').setValue('test');
    await wrapper.find('[data-testid="login-password"]').setValue('test');
    wrapper.vm.reset(true);
    await flushPromises();

    expect(
      (
        wrapper.find('[data-testid="login-username"]')
          .element as HTMLInputElement
      ).value,
    ).toEqual('');
    expect(
      (
        wrapper.find('[data-testid="login-password"]')
          .element as HTMLInputElement
      ).value,
    ).toEqual('');
  });
});
