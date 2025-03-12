import { ComponentMountingOptions, mount } from '@vue/test-utils';

import DevelopersView from 'src/views/developers-view.vue';
import PrivacyView from 'src/views/privacy-view.vue';
import TermsOfServiceView from 'src/views/terms-of-service-view.vue';
import { Router } from 'vue-router';

import CookiesView from '../../../src/views/cookies-view.vue';
import NotFound from '../../../src/views/not-found-view.vue';
import ServerError from '../../../src/views/server-error-view.vue';
import { createRouter } from '../../fixtures/create-router';

describe('Static Views', () => {
  let router: Router;
  let opts: ComponentMountingOptions<unknown>;

  beforeAll(() => {
    router = createRouter();
    opts = {
      global: {
        plugins: [router],
      },
    };
  });

  it('will render Cookie Policy', () => {
    const wrapper = mount(CookiesView, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Developers Policy', () => {
    const wrapper = mount(DevelopersView, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Privacy Policy', () => {
    const wrapper = mount(PrivacyView, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Terms of Service', () => {
    const wrapper = mount(TermsOfServiceView, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Not Found Error page', () => {
    const wrapper = mount(NotFound, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Server Error page', () => {
    const wrapper = mount(ServerError, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
