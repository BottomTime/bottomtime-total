/* eslint-disable no-process-env */
import { mount } from '@vue/test-utils';

import { Router } from 'vue-router';

import PageFooter from '../../../../src/components/core/page-footer.vue';
import { createRouter } from '../../../fixtures/create-router';

describe('Page Footer component', () => {
  let router: Router;
  let oldEnv: object;

  beforeAll(() => {
    router = createRouter();
    oldEnv = Object.assign({}, process.env);
    process.env.BTWEB_VITE_ADMIN_EMAIL = 'administrator@website.com';
  });

  afterAll(() => {
    Object.assign(process.env, oldEnv);
  });

  it('will render correctly', () => {
    const wrapper = mount(PageFooter, {
      global: { stubs: { teleport: true }, plugins: [router] },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
