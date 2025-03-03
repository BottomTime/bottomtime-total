import { ComponentMountingOptions, mount } from '@vue/test-utils';

import DifficultyInput from 'src/components/common/difficulty-input.vue';

describe('DifficultyInput component', () => {
  let opts: ComponentMountingOptions<typeof DifficultyInput>;

  beforeEach(() => {
    opts = {
      props: {
        controlId: 'dif',
      },
    };
  });

  it('will render without a value set', async () => {
    const wrapper = mount(DifficultyInput, opts);
    expect(wrapper.get('input').element.value).toBe('2.5');
    expect(wrapper.get('span').text()).toBe('');
  });

  it('will render with a value set', async () => {
    const wrapper = mount(DifficultyInput, opts);
    await wrapper.setProps({ modelValue: 1.4 });
    expect(wrapper.get('input').element.value).toBe('1.4');
    expect(wrapper.get('span').text()).toBe('1.4');
  });

  it('will allow value to be set', async () => {
    const wrapper = mount(DifficultyInput, opts);
    await wrapper.get('input').setValue('3.2');
    expect(wrapper.get('input').element.value).toBe('3.2');
    expect(wrapper.get('span').text()).toBe('3.2');
    expect(wrapper.emitted('update:modelValue')).toEqual([[3.2]]);
  });
});
