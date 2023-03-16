import { mount } from '@vue/test-utils';

import config from '@/config';
import PageFooter from '@/components/main/PageFooter.vue';

describe('PageFooter Component', () => {
  it('Will render the footer with copyright and appropriate links', () => {
    const wrapper = mount(PageFooter);
    const footer = wrapper.find('footer#app-footer');
    expect(footer.exists()).toBe(true);

    const copyrightText = footer.find('p#app-footer-copyright').text();
    expect(copyrightText).toContain(
      `Copyright © Chris Carleton, ${new Date().getFullYear().toString()}`,
    );

    const contactText = footer.find('p#app-footer-contact').text();
    expect(contactText).toContain(config.adminEmail);
  });
});
