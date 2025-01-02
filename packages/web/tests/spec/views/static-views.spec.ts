import { mount } from '@vue/test-utils';

import { Router } from 'vue-router';

import CookiePolicy from '../../../src/views/cookies-view.vue';
import NotFound from '../../../src/views/not-found-view.vue';
import ServerError from '../../../src/views/server-error-view.vue';
import { createRouter } from '../../fixtures/create-router';

describe('Static Views', () => {
  let router: Router;

  beforeAll(() => {
    router = createRouter();
  });

  it('will render Cookie Policy', () => {
    const wrapper = mount(CookiePolicy, { global: { plugins: [router] } });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Privacy Policy', () => {
    const wrapper = mount(CookiePolicy, { global: { plugins: [router] } });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Terms of Service', () => {
    const wrapper = mount(CookiePolicy, { global: { plugins: [router] } });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Not Found Error page', () => {
    const wrapper = mount(NotFound, { global: { plugins: [router] } });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Server Error page', () => {
    const wrapper = mount(ServerError);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
