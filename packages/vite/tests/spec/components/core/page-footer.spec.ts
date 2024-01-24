import { mount } from '@vue/test-utils';
import PageFooter from '../../../../src/components/core/page-footer.vue';

describe('Page Footer component', () => {
  it('will render correctly', () => {
    const wrapper = mount(PageFooter);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
