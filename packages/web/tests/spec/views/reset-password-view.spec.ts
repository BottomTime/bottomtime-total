import { ApiClient, PasswordResetTokenStatus } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import RequestPasswordReset from '../../../src/components/users/request-password-reset.vue';
import ResetPassword from '../../../src/components/users/reset-password.vue';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser } from '../../../src/store';
import ResetPasswordView from '../../../src/views/reset-password-view.vue';
import { createAxiosError } from '../../fixtures/create-axios-error';
import { createRouter } from '../../fixtures/create-router';
import { BasicUser } from '../../fixtures/users';

const UsernameOrEmailInput = '[data-testid="username"]';
const RequestPasswordResetButton = '[data-testid="reset-password-submit"]';
const EmailSentMessage = '[data-testid="email-sent-message"]';

const NewPasswordInput = '[data-testid="password"]';
const ConfirmPasswordInput = '[data-testid="confirm-password"]';
const ResetPasswordButton = '[data-testid="reset-password-submit"]';

describe('ResetPassword view', () => {
  let client: ApiClient;
  let router: Router;

  let location: MockLocation;
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof ResetPasswordView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/resetPassword',
        name: 'resetPassword',
        component: ResetPasswordView,
      },
    ]);
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = null;
    location = new MockLocation();

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: location,
        },
      },
    };
  });

  it('will not render content if user is logged in', () => {
    currentUser.user = BasicUser;
    const wrapper = mount(ResetPasswordView, opts);
    expect(wrapper.find('[data-testid="auth-content"]').isVisible()).toBe(true);
    expect(wrapper.findComponent(ResetPassword).exists()).toBe(false);
    expect(wrapper.findComponent(RequestPasswordReset).exists()).toBe(false);
  });

  describe('when requesting a password reset', () => {
    beforeEach(async () => {
      await router.push('/resetPassword');
    });

    it('will render the request password reset form if the user is not logged and query string is missing', () => {
      const spy = jest.spyOn(client.users, 'validatePasswordResetToken');
      const wrapper = mount(ResetPasswordView, opts);
      expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(false);
      expect(wrapper.findComponent(ResetPassword).exists()).toBe(false);
      expect(wrapper.findComponent(RequestPasswordReset).isVisible()).toBe(
        true,
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('will do nothing if form validation fails', async () => {
      const spy = jest
        .spyOn(client.users, 'requestPasswordResetToken')
        .mockResolvedValue();
      const wrapper = mount(ResetPasswordView, opts);

      await wrapper
        .find(UsernameOrEmailInput)
        .setValue('Nope! Not a username or password.');
      await wrapper.find(RequestPasswordResetButton).trigger('click');
      await flushPromises();

      expect(spy).not.toHaveBeenCalled();
      expect(wrapper.find('[data-testid="username-error"]').isVisible()).toBe(
        true,
      );
    });

    it('will request a password reset token', async () => {
      const spy = jest
        .spyOn(client.users, 'requestPasswordResetToken')
        .mockResolvedValue();
      const username = 'roger_bob';
      const wrapper = mount(ResetPasswordView, opts);

      await wrapper.find(UsernameOrEmailInput).setValue(username);
      await wrapper.find(RequestPasswordResetButton).trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(username);
      expect(wrapper.find(EmailSentMessage).isVisible()).toBe(true);
    });

    it('will indicate success even if the request fails with a 404 response', async () => {
      const username = 'roger_bob';
      const spy = jest
        .spyOn(client.users, 'requestPasswordResetToken')
        .mockRejectedValue(
          createAxiosError({
            status: 404,
            message: 'Not found',
            method: 'GET',
            path: `/api/users/${username}/resetPassword`,
          }),
        );
      const wrapper = mount(ResetPasswordView, opts);

      await wrapper.find(UsernameOrEmailInput).setValue(username);
      await wrapper.find(RequestPasswordResetButton).trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(username);
      expect(wrapper.find(EmailSentMessage).isVisible()).toBe(true);
    });
  });

  describe('when resetting a password', () => {
    const Username = 'roger_bob';
    const Token = 'abcd1234';

    beforeEach(async () => {
      await router.push(`/resetPassword?token=${Token}&user=${Username}`);
    });

    it('will render failed message if token is invalid', async () => {
      jest
        .spyOn(client.users, 'validatePasswordResetToken')
        .mockResolvedValue(PasswordResetTokenStatus.Invalid);
      const wrapper = mount(ResetPasswordView, opts);
      await flushPromises();
      expect(
        wrapper.find('[data-testid="reset-failed-message"]').isVisible(),
      ).toBe(true);
    });

    it('will render failed message if token is expired', async () => {
      jest
        .spyOn(client.users, 'validatePasswordResetToken')
        .mockResolvedValue(PasswordResetTokenStatus.Expired);
      const wrapper = mount(ResetPasswordView, opts);
      await flushPromises();
      expect(
        wrapper.find('[data-testid="reset-failed-message"]').isVisible(),
      ).toBe(true);
    });

    it('will render the reset form if the token is valid', async () => {
      jest
        .spyOn(client.users, 'validatePasswordResetToken')
        .mockResolvedValue(PasswordResetTokenStatus.Valid);
      const wrapper = mount(ResetPasswordView, opts);
      await flushPromises();
      expect(
        wrapper.find('[data-testid="reset-password-form"]').isVisible(),
      ).toBe(true);
    });

    it('will do nothing if validation fails', async () => {
      jest
        .spyOn(client.users, 'validatePasswordResetToken')
        .mockResolvedValue(PasswordResetTokenStatus.Valid);
      const spy = jest
        .spyOn(client.users, 'resetPasswordWithToken')
        .mockResolvedValue(true);
      const wrapper = mount(ResetPasswordView, opts);
      await flushPromises();

      await wrapper.find(NewPasswordInput).setValue('lame');
      await wrapper.find(ConfirmPasswordInput).setValue("doesn't even match");
      await wrapper.find(ResetPasswordButton).trigger('click');
      await flushPromises();

      expect(spy).not.toHaveBeenCalled();
      expect(
        wrapper.find('[data-testid="reset-password-form"]').isVisible(),
      ).toBe(true);
    });

    it("will reset the user's password", async () => {
      jest
        .spyOn(client.users, 'validatePasswordResetToken')
        .mockResolvedValue(PasswordResetTokenStatus.Valid);
      const spy = jest
        .spyOn(client.users, 'resetPasswordWithToken')
        .mockResolvedValue(true);
      const newPassword = 'Str0ng__S3cret!';
      const wrapper = mount(ResetPasswordView, opts);
      await flushPromises();

      await wrapper.find(NewPasswordInput).setValue(newPassword);
      await wrapper.find(ConfirmPasswordInput).setValue(newPassword);
      await wrapper.find(ResetPasswordButton).trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(Username, Token, newPassword);
      expect(
        wrapper.find('[data-testid="reset-success-message"]').isVisible(),
      ).toBe(true);
    });

    it('will show failed message if password reset is rejected', async () => {
      jest
        .spyOn(client.users, 'validatePasswordResetToken')
        .mockResolvedValue(PasswordResetTokenStatus.Valid);
      const spy = jest
        .spyOn(client.users, 'resetPasswordWithToken')
        .mockResolvedValue(false);
      const newPassword = 'Str0ng__S3cret!';
      const wrapper = mount(ResetPasswordView, opts);
      await flushPromises();

      await wrapper.find(NewPasswordInput).setValue(newPassword);
      await wrapper.find(ConfirmPasswordInput).setValue(newPassword);
      await wrapper.find(ResetPasswordButton).trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(Username, Token, newPassword);
      expect(
        wrapper.find('[data-testid="reset-failed-message"]').isVisible(),
      ).toBe(true);
    });

    it('will show failed message if password reset fails with a 404 response', async () => {
      jest
        .spyOn(client.users, 'validatePasswordResetToken')
        .mockResolvedValue(PasswordResetTokenStatus.Valid);
      const spy = jest
        .spyOn(client.users, 'resetPasswordWithToken')
        .mockRejectedValue(
          createAxiosError({
            status: 404,
            message: 'Not found',
            method: 'POST',
            path: `/api/users/${Username}/resetPassword`,
          }),
        );
      const newPassword = 'Str0ng__S3cret!';
      const wrapper = mount(ResetPasswordView, opts);
      await flushPromises();

      await wrapper.find(NewPasswordInput).setValue(newPassword);
      await wrapper.find(ConfirmPasswordInput).setValue(newPassword);
      await wrapper.find(ResetPasswordButton).trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(Username, Token, newPassword);
      expect(
        wrapper.find('[data-testid="reset-failed-message"]').isVisible(),
      ).toBe(true);
    });
  });
});
