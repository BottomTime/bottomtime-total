import { mount } from '@vue/test-utils';
import PageTitle from '../../../../src/components/common/page-title.vue';

describe('Page Title component', () => {
  it('will render correctly with subtitle', () => {
    const wrapper = mount(PageTitle, {
      props: {
        title: 'Test Title',
        subtitle: 'Test Subtitle',
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly without subtitle', () => {
    const wrapper = mount(PageTitle, {
      props: {
        title: 'Test Title',
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
