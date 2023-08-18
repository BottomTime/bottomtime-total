import { Mock } from 'moq.ts';
import { flushPromises, mount } from '@vue/test-utils';

import { createErrorHandler } from '@/helpers';
import CreateNewPasswordForm from '@/components/users/CreateNewPasswordForm.vue';
import { createStore } from '@/store';
import { UserManager } from '@/client/users';
import { ApiClientKey, StoreKey, WithErrorHandlingKey } from '@/injection-keys';
import { ApiClient } from '@/client';

const TestProps = {
  username: 'ricky_bobby',
  token: 'f982h48242e8h2fh242424y2h4h24h2r8fhwf2',
};

describe('CreateNewPasswordForm component', () => {
  const withErrorHandling = createErrorHandler(createStore());
  const userManager = new Mock<UserManager>().object();
  const apiClient = new Mock<ApiClient>()
    .setup((c) => c.users)
    .returns(userManager)
    .object();

  [
    {
      name: 'username is missing',
      token: '2098t4h204f20',
    },
    {
      name: 'token is missing',
      username: 'ralf12',
    },
    {
      name: 'username is invalid',
      username: 'definitely not a valid username!',
      token: 'fowin203298j4ff3402f',
    },
    {
      name: 'token is invalid',
      username: 'mike82',
      token: 'wat? Not good!',
    },
  ].forEach((testCase) => {
    it(`Will display error message if ${testCase.name}`, () => {
      const wrapper = mount(CreateNewPasswordForm, {
        global: {
          provide: {
            [ApiClientKey as symbol]: apiClient,
            [WithErrorHandlingKey as symbol]: withErrorHandling,
          },
        },
        props: {
          username: testCase.username ?? '',
          token: testCase.token ?? '',
        },
      });
      expect(wrapper.get('article#msg-invalid-query').isVisible()).toBe(true);
      expect(wrapper.find('fieldset#form-new-password').exists()).toBe(false);
    });
  });

  it('Will show validation error if fields are missing', async () => {
    const wrapper = mount(CreateNewPasswordForm, {
      global: {
        provide: {
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
      props: {
        ...TestProps,
      },
    });

    await wrapper.get('button#btn-create-password').trigger('click');
    expect(
      wrapper.get('span#err-newPassword-required').text(),
    ).toMatchSnapshot();
    expect(
      wrapper.get('span#err-confirmPassword-required').text(),
    ).toMatchSnapshot();
  });

  it('Will show validation errors if new password does not meet strength requirements or confirm password does not match', async () => {
    const wrapper = mount(CreateNewPasswordForm, {
      global: {
        provide: {
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
      props: {
        ...TestProps,
      },
    });

    await wrapper.get('input#newPassword').setValue('weak');
    await wrapper.get('input#confirmPassword').setValue('w3@k');
    await wrapper.get('button#btn-create-password').trigger('click');
    expect(
      wrapper.get('span#err-newPassword-strength').text(),
    ).toMatchSnapshot();
    expect(
      wrapper.get('span#err-confirmPassword-matches').text(),
    ).toMatchSnapshot();
  });

  it('Will display an error if the request is rejected', async () => {
    const store = createStore();
    const withErrorHandling = createErrorHandler(store);
    const newPassword = '*(*h92r030jjfo4*HIOH';
    const userManager = new Mock<UserManager>()
      .setup((instance) =>
        instance.resetPassword(
          TestProps.username,
          TestProps.token,
          newPassword,
        ),
      )
      .returnsAsync(false)
      .object();
    const apiClient = new Mock<ApiClient>()
      .setup((c) => c.users)
      .returns(userManager)
      .object();
    const wrapper = mount(CreateNewPasswordForm, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
      props: {
        ...TestProps,
      },
    });
    const dispatch = jest.spyOn(store, 'dispatch').mockResolvedValue(undefined);

    await wrapper.get('input#newPassword').setValue(newPassword);
    await wrapper.get('input#confirmPassword').setValue(newPassword);
    await wrapper.get('button#btn-create-password').trigger('click');
    await flushPromises();

    expect(wrapper.find('article#msg-password-reset').exists()).toBe(false);
    expect(
      (wrapper.get('input#newPassword').element as HTMLInputElement).value,
    ).toHaveLength(0);
    expect(
      (wrapper.get('input#confirmPassword').element as HTMLInputElement).value,
    ).toHaveLength(0);

    expect(dispatch).toBeCalled();
    expect(dispatch.mock.lastCall).toMatchSnapshot();
  });

  it('Will display success message if password is reset', async () => {
    const newPassword = '*(*h92r030jjfo4*HIOH';
    const userManager = new Mock<UserManager>()
      .setup((instance) =>
        instance.resetPassword(
          TestProps.username,
          TestProps.token,
          newPassword,
        ),
      )
      .returnsAsync(true)
      .object();
    const apiClient = new Mock<ApiClient>()
      .setup((c) => c.users)
      .returns(userManager)
      .object();
    const wrapper = mount(CreateNewPasswordForm, {
      global: {
        provide: {
          [ApiClientKey as symbol]: apiClient,
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
      props: {
        ...TestProps,
      },
    });

    await wrapper.get('input#newPassword').setValue(newPassword);
    await wrapper.get('input#confirmPassword').setValue(newPassword);
    await wrapper.get('button#btn-create-password').trigger('click');
    await flushPromises();

    expect(wrapper.get('article#msg-password-reset').isVisible()).toBe(true);
  });
});
