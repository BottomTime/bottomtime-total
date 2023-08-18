import { Mock } from 'moq.ts';
import { flushPromises, mount } from '@vue/test-utils';

import { createStore } from '@/store';
import ResetPasswordForm from '@/components/users/ResetPasswordForm.vue';
import { UserManager } from '@/client/users';
import { ApiClientKey, WithErrorHandlingKey } from '@/injection-keys';
import { createErrorHandler } from '@/helpers';
import { ApiClient } from '@/client';

describe('ResetPasswordForm component', () => {
  it('Will raise validation error if username or email is not entered', async () => {
    const apiClient = new Mock<ApiClient>().object();
    const withErrorHandling = createErrorHandler(createStore());
    const wrapper = mount(ResetPasswordForm, {
      global: {
        provide: {
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    await wrapper.get('button#btn-submit-reset-request').trigger('click');
    expect(
      wrapper.get('span#err-usernameOrEmail-required').text(),
    ).toMatchSnapshot();
  });

  it('Will raise validation error if username or email is invalid', async () => {
    const apiClient = new Mock<ApiClient>().object();
    const withErrorHandling = createErrorHandler(createStore());
    const wrapper = mount(ResetPasswordForm, {
      global: {
        provide: {
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    await wrapper.get('input#usernameOrEmail').setValue('not valid');
    await wrapper.get('button#btn-submit-reset-request').trigger('click');
    expect(
      wrapper.get('span#err-usernameOrEmail-valid').text(),
    ).toMatchSnapshot();
  });

  it('Will submit request for a password reset and allow for a retry if necesssary', async () => {
    const email = 'mikey_42@gmail.org';
    const userManagerMock = new Mock<UserManager>()
      .setup((instance) => instance.requestPasswordReset(email))
      .returnsAsync();
    const apiClient = new Mock<ApiClient>()
      .setup((c) => c.users)
      .returns(userManagerMock.object())
      .object();
    const withErrorHandling = createErrorHandler(createStore());
    const wrapper = mount(ResetPasswordForm, {
      global: {
        provide: {
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
    });
    await wrapper.get('input#usernameOrEmail').setValue();
    await wrapper.get('button#btn-submit-reset-request').trigger('click');
    await flushPromises();

    expect(wrapper.find('span.help.is-danger').exists()).toBe(false);
    expect(wrapper.get('article#msg-request-submitted').isVisible()).toBe(true);
    expect(wrapper.find('input#usernameOrEmail').exists()).toBe(false);

    await wrapper.get('a#btn-reset-form').trigger('click');
    const input = wrapper.get('input#usernameOrEmail');
    expect(input.isVisible()).toBe(true);
    expect((input.element as HTMLInputElement).value).toHaveLength(0);
  });
});
