import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { nextTick } from 'vue';

import ChangePasswordDialog from '../../../../src/components/dialog/change-password-dialog.vue';

const OldPassword = 'old-Password';
const StrongPassword = '@STRo0ngPWSSw..d';

const OldPasswordSelector = 'input#oldPassword';
const NewPasswordSelector = 'input#newPassword';
const ConfirmPasswordSelector = 'input#confirmPassword';
const ConfirmSelector = '[data-testid="confirm-change-password"]';
const CancelSelector = '[data-testid="cancel-change-password"]';
const ToggleShowPasswordSelector = '[data-testid="toggle-show-password"]';

describe('Change Password dialog', () => {
  let opts: ComponentMountingOptions<typeof ChangePasswordDialog>;

  beforeEach(() => {
    opts = {
      global: {
        stubs: { teleport: true },
      },
    };
  });

  it('will not render if visible is false', () => {
    const wrapper = mount(ChangePasswordDialog, opts);
    expect(wrapper.find('[data-testid="dialog-modal"]').exists()).toBe(false);
  });

  it('will cancel if the dialog is closed', async () => {
    const wrapper = mount(ChangePasswordDialog, {
      props: {
        visible: true,
      },
      ...opts,
    });

    await wrapper.get('[data-testid="dialog-close-button"]').trigger('click');
    await nextTick();

    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('will cancel if the cancel button is clicked', async () => {
    const wrapper = mount(ChangePasswordDialog, {
      props: {
        visible: true,
      },
      ...opts,
    });

    await wrapper.get(CancelSelector).trigger('click');
    await nextTick();

    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('will hide passwords by default', async () => {
    const wrapper = mount(ChangePasswordDialog, {
      props: {
        visible: true,
      },
      ...opts,
    });

    expect(wrapper.get(OldPasswordSelector).attributes('type')).toBe(
      'password',
    );
    expect(wrapper.get(NewPasswordSelector).attributes('type')).toBe(
      'password',
    );
    expect(wrapper.get(ConfirmPasswordSelector).attributes('type')).toBe(
      'password',
    );
  });

  it('will submit when old password is required', async () => {
    const wrapper = mount(ChangePasswordDialog, {
      props: {
        visible: true,
      },
      ...opts,
    });

    await wrapper.get(OldPasswordSelector).setValue(OldPassword);
    await wrapper.get(NewPasswordSelector).setValue(StrongPassword);
    await wrapper.get(ConfirmPasswordSelector).setValue(StrongPassword);
    await wrapper.get(ConfirmSelector).trigger('click');

    await flushPromises();

    expect(wrapper.emitted('confirm')).toEqual([[StrongPassword, OldPassword]]);
  });

  it('will submit when old password is not required', async () => {
    const wrapper = mount(ChangePasswordDialog, {
      props: {
        visible: true,
        requireOldPassword: false,
      },
      ...opts,
    });

    await wrapper.get(NewPasswordSelector).setValue(StrongPassword);
    await wrapper.get(ConfirmPasswordSelector).setValue(StrongPassword);
    await wrapper.get(ConfirmSelector).trigger('click');

    await flushPromises();

    expect(wrapper.find(OldPasswordSelector).exists()).toBe(false);
    expect(wrapper.emitted('confirm')).toEqual([[StrongPassword]]);
  });

  it('will submit without confirmation if the password is displayed', async () => {
    const wrapper = mount(ChangePasswordDialog, {
      props: {
        visible: true,
        showPassword: true,
      },
      ...opts,
    });

    expect(wrapper.get(NewPasswordSelector).attributes('type')).toBe('text');

    await wrapper.get(OldPasswordSelector).setValue(OldPassword);
    await wrapper.get(NewPasswordSelector).setValue(StrongPassword);
    await wrapper.get(ConfirmSelector).trigger('click');

    await flushPromises();

    expect(wrapper.find(ConfirmPasswordSelector).exists()).toBe(false);
    expect(wrapper.emitted('confirm')).toEqual([[StrongPassword, OldPassword]]);
  });

  it('will toggle password visibility', async () => {
    const wrapper = mount(ChangePasswordDialog, {
      props: {
        visible: true,
      },
      ...opts,
    });

    await wrapper.get(OldPasswordSelector).setValue(OldPassword);
    await wrapper.get(NewPasswordSelector).setValue(StrongPassword);
    await wrapper.get(ConfirmPasswordSelector).setValue(StrongPassword);

    const toggleButton = wrapper.get(ToggleShowPasswordSelector);
    await toggleButton.trigger('click');
    await flushPromises();

    expect(wrapper.get(OldPasswordSelector).attributes('type')).toBe(
      'password',
    );
    expect(wrapper.get(NewPasswordSelector).attributes('type')).toBe('text');
    expect(wrapper.find(ConfirmPasswordSelector).exists()).toBe(false);

    await toggleButton.trigger('click');
    await flushPromises();

    expect(wrapper.get(OldPasswordSelector).attributes('type')).toBe(
      'password',
    );
    expect(wrapper.get(NewPasswordSelector).attributes('type')).toBe(
      'password',
    );
    expect(wrapper.get(ConfirmPasswordSelector).isVisible()).toBe(true);
  });

  it('will fail validation if required fields are not provided', async () => {
    const wrapper = mount(ChangePasswordDialog, {
      props: {
        visible: true,
      },
      ...opts,
    });

    await wrapper.get(ConfirmSelector).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('confirm')).toBeUndefined();
    expect(wrapper.get('[data-testid="oldPassword-error"]').text()).toBe(
      'Old password is required',
    );
    expect(wrapper.get('[data-testid="newPassword-error"]').text()).toBe(
      'New password is required',
    );
    expect(wrapper.get('[data-testid="confirmPassword-error"]').text()).toBe(
      'Please confirm the new password',
    );
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });

  it('will fail validation if new password is not strong enough', async () => {
    const wrapper = mount(ChangePasswordDialog, {
      props: {
        visible: true,
      },
      ...opts,
    });

    await wrapper.get(OldPasswordSelector).setValue(OldPassword);
    await wrapper.get(NewPasswordSelector).setValue('weak');
    await wrapper.get(ConfirmPasswordSelector).setValue('weak');
    await wrapper.get(ConfirmSelector).trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-testid="newPassword-error"]').text()).toBe(
      'New password must meet strength requirements',
    );
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });

  it('will fail validation if new password does not match confirmation', async () => {
    const wrapper = mount(ChangePasswordDialog, {
      props: {
        visible: true,
      },
      ...opts,
    });

    await wrapper.get(OldPasswordSelector).setValue(OldPassword);
    await wrapper.get(NewPasswordSelector).setValue(StrongPassword);
    await wrapper.get(ConfirmPasswordSelector).setValue('not-the-same');
    await wrapper.get(ConfirmSelector).trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-testid="confirmPassword-error"]').text()).toBe(
      'Passwords do not match',
    );
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });

  it('will allow the parent component to reset the dialog', async () => {
    const wrapper = mount(ChangePasswordDialog, {
      props: {
        visible: true,
      },
      ...opts,
    });

    await wrapper.get(NewPasswordSelector).setValue('weak sauce');
    await wrapper.get(ConfirmPasswordSelector).setValue(StrongPassword);
    await wrapper.get(ConfirmSelector).trigger('click');
    await flushPromises();

    wrapper.vm.reset();
    await nextTick();

    const oldPasswordInput = wrapper.get<HTMLInputElement>(OldPasswordSelector);
    expect(oldPasswordInput.element.value).toBe('');

    // TODO: How do I test focus??
    // expect(oldPasswordInput.element).toBe(document.activeElement);

    expect(
      wrapper.get<HTMLInputElement>(NewPasswordSelector).element.value,
    ).toBe('');
    expect(
      wrapper.get<HTMLInputElement>(ConfirmPasswordSelector).element.value,
    ).toBe('');

    expect(wrapper.find('[data-testid="oldPassword-error"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="newPassword-error"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="confirmPassword-error"]').exists()).toBe(
      false,
    );
  });

  it('will allow the parent to clear the old password on a bad guess', async () => {
    const wrapper = mount(ChangePasswordDialog, {
      props: {
        visible: true,
      },
      ...opts,
    });

    await wrapper.get(OldPasswordSelector).setValue(OldPassword);
    await wrapper.get(NewPasswordSelector).setValue(StrongPassword);
    await wrapper.get(ConfirmPasswordSelector).setValue(StrongPassword);
    await wrapper.get(ConfirmSelector).trigger('click');
    await flushPromises();

    wrapper.vm.clearOldPassword();
    await nextTick();

    const oldPasswordInput = wrapper.get<HTMLInputElement>(OldPasswordSelector);
    expect(oldPasswordInput.element.value).toBe('');

    // TODO: How do I check for focus?
    // expect(oldPasswordInput.element).toBe(document.activeElement);
  });
});
