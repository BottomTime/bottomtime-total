import { mount } from '@vue/test-utils';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

describe('Loading Spinner', () => {
  it('Will render with default message', () => {
    const wrapper = mount(LoadingSpinner);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('Will render with custom message', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { message: 'Loading wozzles...' },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
