import { flushPromises, mount } from '@vue/test-utils';

import FormButton from '../../../../src/components/common/form-button.vue';
import RequestPasswordReset from '../../../../src/components/users/request-password-reset.vue';

const UsernameInput = '[data-testid="username"]';
const UsernameError = '[data-testid="username-error"]';
const ResetPasswordButton = 'button[type="submit"]';
const EmailSentMessage = '[data-testid="email-sent-message"]';

describe('RequestPasswordReset component', () => {
  it('will render correctly with default props', async () => {
    const wrapper = mount(RequestPasswordReset);
    expect(wrapper.find(EmailSentMessage).exists()).toBe(false);
    expect(wrapper.find(ResetPasswordButton).isVisible()).toBe(true);
  });

  it('will validate missing username', async () => {
    const wrapper = mount(RequestPasswordReset);
    await wrapper.find(ResetPasswordButton).trigger('click');
    expect(wrapper.find(UsernameError).text()).toBe(
      'Username or email is required to proceed',
    );
  });

  it('will validate that the username or password is valid', async () => {
    const wrapper = mount(RequestPasswordReset);
    await wrapper.find(UsernameInput).setValue('Nope! Not valid.');
    await wrapper.find(ResetPasswordButton).trigger('click');
    expect(wrapper.find(UsernameError).text()).toBe(
      'Must be a valid username or email address',
    );
  });

  it('will emit a "request-email" event if the form is valid', async () => {
    const username = 'dell43';
    const wrapper = mount(RequestPasswordReset);
    await wrapper.find(UsernameInput).setValue(username);
    await wrapper.find(ResetPasswordButton).trigger('click');
    await flushPromises();
    expect(wrapper.emitted('request-email')).toEqual([[username]]);
  });

  it('will show a loading spinner if the "isLoading" prop is true', async () => {
    const wrapper = mount(RequestPasswordReset, { props: { isLoading: true } });
    expect(wrapper.findComponent(FormButton).props('isLoading')).toBe(true);
  });

  it('will indicate a success message if the "emailSent" prop is true', async () => {
    const wrapper = mount(RequestPasswordReset, { props: { emailSent: true } });
    expect(wrapper.find(EmailSentMessage).isVisible()).toBe(true);
    expect(wrapper.find(ResetPasswordButton).exists()).toBe(false);
  });
});
