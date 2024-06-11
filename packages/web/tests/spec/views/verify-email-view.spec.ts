import { ApiClient } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import VerifyEmailView from '../../../src/views/verify-email-view.vue';
import { createAxiosError } from '../../fixtures/create-axios-error';
import { createRouter } from '../../fixtures/create-router';

const Username = 'ricky_bobby44';
const Token = '1234567890abcdef';
const SuccessMessage = '[data-testid="msg-success"]';
const FailureMessage = '[data-testid="msg-failed"]';

function getUrl(): string {
  return `/verifyEmail?user=${Username}&token=${Token}`;
}

describe('Verify Email View', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof VerifyEmailView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/verifyEmail',
        component: VerifyEmailView,
      },
    ]);
  });

  beforeEach(async () => {
    pinia = createPinia();

    await router.push(getUrl());

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will display a success message if successful', async () => {
    const spy = jest
      .spyOn(client.users, 'verifyEmail')
      .mockResolvedValue({ succeeded: true });
    const wrapper = mount(VerifyEmailView, opts);
    await flushPromises();

    const message = wrapper.find(SuccessMessage);
    expect(wrapper.find(FailureMessage).exists()).toBe(false);
    expect(message.isVisible()).toBe(true);
    expect(message.html()).toMatchSnapshot();
    expect(spy).toHaveBeenCalledWith(Username, Token);
  });

  it('will show an error message if the token is invalid', async () => {
    const spy = jest.spyOn(client.users, 'verifyEmail').mockResolvedValue({
      succeeded: false,
      reason: 'Your token is hella-expired!',
    });
    const wrapper = mount(VerifyEmailView, opts);
    await flushPromises();

    const message = wrapper.find(FailureMessage);
    expect(wrapper.find(SuccessMessage).exists()).toBe(false);
    expect(message.isVisible()).toBe(true);
    expect(message.html()).toMatchSnapshot();
    expect(spy).toHaveBeenCalledWith(Username, Token);
  });

  it('will show an error message if the server responds with a 500', async () => {
    const spy = jest
      .spyOn(client.users, 'verifyEmail')
      .mockRejectedValue(createAxiosError(500));
    const wrapper = mount(VerifyEmailView, opts);
    await flushPromises();

    const message = wrapper.find(FailureMessage);
    expect(wrapper.find(SuccessMessage).exists()).toBe(false);
    expect(message.isVisible()).toBe(true);
    expect(message.html()).toMatchSnapshot();
    expect(spy).toHaveBeenCalledWith(Username, Token);
  });

  it('will show an error message if the query string is missing', async () => {
    await router.push('/verifyEmail');
    const spy = jest.spyOn(client.users, 'verifyEmail');
    const wrapper = mount(VerifyEmailView, opts);
    await flushPromises();

    const message = wrapper.find(FailureMessage);
    expect(wrapper.find(SuccessMessage).exists()).toBe(false);
    expect(message.isVisible()).toBe(true);
    expect(message.html()).toMatchSnapshot();
    expect(spy).not.toHaveBeenCalled();
  });
});
