import {
  AccountTier,
  ApiClient,
  DepthUnit,
  Fetcher,
  LogBookSharing,
  PressureUnit,
  TemperatureUnit,
  UserDTO,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { flushPromises, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import LoginForm from '../../../../src/components/users/login-form.vue';
import { useCurrentUser, useToasts } from '../../../../src/store';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';

const UsernameInput = '[data-testid="login-username"]';
const PasswordInput = '[data-testid="login-password"]';
const LoginButton = '[data-testid="login-submit"]';

const UserData: UserDTO = {
  id: 'b8d70e2c-bea3-4f21-9eeb-42a4aa79f706',
  accountTier: AccountTier.Basic,
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
    accountTier: AccountTier.Basic,
    userId: 'B8D70E2C-BEA3-4F21-9EEB-42A4AA79F706',
    username: 'j.bard43',
    memberSince: new Date('2021-08-01T00:00:00.000Z'),
    logBookSharing: LogBookSharing.FriendsOnly,
    name: 'John Bard',
  },
  settings: {
    depthUnit: DepthUnit.Meters,
    pressureUnit: PressureUnit.Bar,
    temperatureUnit: TemperatureUnit.Celsius,
    weightUnit: WeightUnit.Kilograms,
  },
};

describe('Login Form component', () => {
  let pinia: Pinia;
  let router: Router;
  let fetcher: Fetcher;
  let client: ApiClient;

  beforeEach(() => {
    pinia = createPinia();
    router = createRouter();
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
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
    await wrapper.find(LoginButton).trigger('click');
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
    const spy = jest.spyOn(client.auth, 'login').mockResolvedValue(UserData);

    await wrapper.find(UsernameInput).setValue(usernameOrEmail);
    await wrapper.find(PasswordInput).setValue(password);
    await wrapper.find(LoginButton).trigger('click');
    await flushPromises();

    expect(currentUser.displayName).toEqual(UserData.profile.name);
    expect(spy).toHaveBeenCalledWith(usernameOrEmail, password);
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
    jest.spyOn(client.auth, 'login').mockRejectedValue(
      createHttpError({
        status: 401,
        message: 'Nope',
        method: 'POST',
        path: '/api/auth/login',
      }),
    );

    await wrapper.find(UsernameInput).setValue(usernameOrEmail);
    await wrapper.find(PasswordInput).setValue(password);
    await wrapper.find(LoginButton).trigger('click');
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

    await wrapper.find(UsernameInput).setValue('test');
    await wrapper.find(PasswordInput).setValue('test');
    wrapper.vm.reset(true);
    await flushPromises();

    expect(wrapper.find<HTMLInputElement>(UsernameInput).element.value).toEqual(
      '',
    );
    expect(wrapper.find<HTMLInputElement>(PasswordInput).element.value).toEqual(
      '',
    );
  });

  it('will redirect on successful login if "redirectTo" prop is set', async () => {
    const spy = jest.spyOn(client.auth, 'login').mockResolvedValue(UserData);
    const wrapper = mount(LoginForm, {
      props: {
        redirectTo: '/profile',
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    });

    await wrapper.find(UsernameInput).setValue(UserData.username);
    await wrapper.find(PasswordInput).setValue('S3cret!');
    await wrapper.find(LoginButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalled();
    expect(router.currentRoute.value.path).toEqual('/profile');
  });

  it('will prefill username if "username" prop is set', async () => {
    const username = 'timmy3333';
    const wrapper = mount(LoginForm, {
      props: {
        username,
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    });

    expect(wrapper.find<HTMLInputElement>(UsernameInput).element.value).toEqual(
      username,
    );
  });
});
