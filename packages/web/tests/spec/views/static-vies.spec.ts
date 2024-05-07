import { mount } from '@vue/test-utils';

import NotFound from '../../../src/components/common/not-found.vue';
import CookiePolicy from '../../../src/views/cookies-view.vue';
import PrivacyPolicy from '../../../src/views/privacy-view.vue';
import ServerError from '../../../src/views/server-error-view.vue';
import TermsOfService from '../../../src/views/terms-of-service-view.vue';

describe('Static Views', () => {
  it('will render Cookie Policy', () => {
    const wrapper = mount(CookiePolicy);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Privacy Policy', () => {
    const wrapper = mount(PrivacyPolicy);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Terms of Service', () => {
    const wrapper = mount(TermsOfService);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Not Found Error page', () => {
    const wrapper = mount(NotFound);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render Server Error page', () => {
    const wrapper = mount(ServerError);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
