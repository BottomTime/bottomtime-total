import { mount } from '@vue/test-utils';

import DurationText from '../../../../src/components/common/duration-text.vue';

describe('DurationText component', () => {
  it('will render correctly given a duration', () => {
    const wrapper = mount(DurationText, { props: { duration: 4274.23 } });
    expect(wrapper.text()).toMatchSnapshot();
  });

  it('will render a shorter time correctly', () => {
    const wrapper = mount(DurationText, { props: { duration: 23.45 } });
    expect(wrapper.text()).toMatchSnapshot();
  });

  it('will render an empty value correctly', () => {
    const wrapper = mount(DurationText);
    expect(wrapper.text()).toMatchSnapshot();
  });
});
