import { mount } from '@vue/test-utils';

import LoadingSpinner from '../../../../src/components/common/loading-spinner.vue';

describe('LoadingSpinner component', () => {
  it('will render correctly with default message', () => {
    const wrapper = mount(LoadingSpinner);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly with custom message', () => {
    const message = 'Omg! Loading stuff...';
    const wrapper = mount(LoadingSpinner, { props: { message } });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
