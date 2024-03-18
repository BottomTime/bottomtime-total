import { mount } from '@vue/test-utils';

import CloseButton from '../../../../src/components/common/close-button.vue';

describe('Close Button component', () => {
  it('will render correctly', () => {
    const wrapper = mount(CloseButton, {
      props: {
        label: 'Dissmiss',
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit close event when clicked', async () => {
    const wrapper = mount(CloseButton);
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('close')).toEqual([[]]);
  });
});
