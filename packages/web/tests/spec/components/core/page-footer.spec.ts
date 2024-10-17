/* eslint-disable no-process-env */
import { mount } from '@vue/test-utils';

import PageFooter from '../../../../src/components/core/page-footer.vue';

describe('Page Footer component', () => {
  let oldEnv: object;

  beforeAll(() => {
    oldEnv = Object.assign({}, process.env);
    process.env.BTWEB_VITE_ADMIN_EMAIL = 'administrator@website.com';
  });

  afterAll(() => {
    Object.assign(process.env, oldEnv);
  });

  it('will render correctly', () => {
    const wrapper = mount(PageFooter, {
      global: { stubs: { teleport: true } },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
