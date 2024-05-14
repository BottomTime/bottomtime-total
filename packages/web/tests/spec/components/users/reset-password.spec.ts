import { ApiClient, PasswordResetTokenStatus } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import FormButton from '../../../../src/components/common/form-button.vue';
import ResetPassword from '../../../../src/components/users/reset-password.vue';
import { LocationKey, MockLocation } from '../../../../src/location';
import { createRouter } from '../../../fixtures/create-router';

const Token = '1234567890';
const Username = 'j.bard43';

const SuccessMessage = '[data-testid="reset-success-message"]';
const FailedMessage = '[data-testid="reset-failed-message"]';
const ResetPasswordForm = '[data-testid="reset-password-form"]';
const ResetButton = 'button[type="submit"]';
const PasswordInput = '[data-testid="password"]';
const ConfirmPasswordInput = '[data-testid="confirm-password"]';
const PasswordError = '[data-testid="password-error"]';
const ConfirmPasswordError = '[data-testid="confirmPassword-error"]';

const BaseProps = {
  token: Token,
  username: Username,
};

describe('ResetPassword component', () => {
  let client: ApiClient;
  let router: Router;

  let location: MockLocation;
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof ResetPassword>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    location = new MockLocation();
    opts = {
      props: BaseProps,
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: location,
        },
      },
    };
  });

  it('will indicate that the password has been reset and show the login form if resetState is valid', async () => {
    opts.props = {
      ...BaseProps,
      resetState: PasswordResetTokenStatus.Valid,
    };
    const wrapper = mount(ResetPassword, opts);
    expect(wrapper.find(SuccessMessage).isVisible()).toBe(true);
    expect(wrapper.find(FailedMessage).exists()).toBe(false);
    expect(wrapper.find(ResetPasswordForm).exists()).toBe(false);
    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(
      wrapper.find<HTMLInputElement>('[data-testid="login-username"]').element
        .value,
    ).toBe(Username);
  });

  it('will indicate that the password reset failed if resetState is invalid', async () => {
    opts.props = {
      ...BaseProps,
      resetState: PasswordResetTokenStatus.Invalid,
    };
    const wrapper = mount(ResetPassword, opts);
    expect(wrapper.find(SuccessMessage).exists()).toBe(false);
    expect(wrapper.find(FailedMessage).isVisible()).toBe(true);
    expect(wrapper.find(ResetPasswordForm).exists()).toBe(false);
  });

  it('will indicate that the password reset failed if resetState is expired', async () => {
    opts.props = {
      ...BaseProps,
      resetState: PasswordResetTokenStatus.Expired,
    };
    const wrapper = mount(ResetPassword, opts);
    expect(wrapper.find(SuccessMessage).exists()).toBe(false);
    expect(wrapper.find(FailedMessage).isVisible()).toBe(true);
    expect(wrapper.find(ResetPasswordForm).exists()).toBe(false);
  });

  it('will render the reset form if resetState is undefined', async () => {
    const wrapper = mount(ResetPassword, opts);
    expect(wrapper.find(SuccessMessage).exists()).toBe(false);
    expect(wrapper.find(FailedMessage).exists()).toBe(false);
    expect(wrapper.find(ResetPasswordForm).isVisible()).toBe(true);
  });

  it('will validate for missing values', async () => {
    const wrapper = mount(ResetPassword, opts);
    await wrapper.find(ResetButton).trigger('click');
    expect(wrapper.find(PasswordError).text()).toBe('New password is required');
    expect(wrapper.find(ConfirmPasswordError).text()).toBe(
      'Confirm password is required',
    );
  });

  it('will validate for weak passwords', async () => {
    const wrapper = mount(ResetPassword, opts);
    await wrapper.find(PasswordInput).setValue('weak');
    await wrapper.find(ResetButton).trigger('click');
    expect(wrapper.find(PasswordError).text()).toBe(
      'New password must meet the minimum requirements',
    );
  });

  it('will validate that the passwords match', async () => {
    const wrapper = mount(ResetPassword, opts);
    await wrapper.find(PasswordInput).setValue('__Strong1!');
    await wrapper.find(ConfirmPasswordInput).setValue('__Strong2!');
    await wrapper.find(ResetButton).trigger('click');
    expect(wrapper.find(ConfirmPasswordError).text()).toBe(
      'Passwords do not match',
    );
  });

  it('will emit a "reset-password" event if the form is valid', async () => {
    const password = '__Strong1!';
    const wrapper = mount(ResetPassword, opts);
    await wrapper.find(PasswordInput).setValue(password);
    await wrapper.find(ConfirmPasswordInput).setValue(password);
    await wrapper.find(ResetButton).trigger('click');
    await flushPromises();
    expect(wrapper.emitted('reset-password')).toEqual([[password]]);
  });

  it('will show a loading spinner if the "isLoading" prop is true', async () => {
    opts.props = {
      ...BaseProps,
      isLoading: true,
    };
    const wrapper = mount(ResetPassword, opts);
    await flushPromises();
    expect(
      wrapper
        .findComponent<typeof FormButton>(
          '[data-testid="reset-password-submit"]',
        )
        .props('isLoading'),
    ).toBe(true);
  });
});
