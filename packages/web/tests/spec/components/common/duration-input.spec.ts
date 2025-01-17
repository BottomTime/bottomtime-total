import { ComponentMountingOptions, mount } from '@vue/test-utils';

import DurationInput from '../../../../src/components/common/duration-input.vue';

enum DurationInputText {
  Hours = '#duration-hours',
  Minutes = '#duration-minutes',
  Seconds = '#duration-seconds',
}

describe('DurationInput component', () => {
  function getOpts(
    value: string | number,
  ): ComponentMountingOptions<typeof DurationInput> {
    return {
      props: {
        controlId: 'duration',
        modelValue: value,
      },
    };
  }

  it('will render correctly with no duration set', async () => {
    const wrapper = mount(DurationInput, getOpts(''));
    expect(
      wrapper.get<HTMLInputElement>(DurationInputText.Hours).element.value,
    ).toBe('');
    expect(
      wrapper.get<HTMLInputElement>(DurationInputText.Minutes).element.value,
    ).toBe('');
    expect(
      wrapper.get<HTMLInputElement>(DurationInputText.Seconds).element.value,
    ).toBe('');
  });

  it('will render correctly with duration set', async () => {
    const wrapper = mount(DurationInput, getOpts(4123.33));
    expect(
      wrapper.get<HTMLInputElement>(DurationInputText.Hours).element.value,
    ).toBe('01');
    expect(
      wrapper.get<HTMLInputElement>(DurationInputText.Minutes).element.value,
    ).toBe('08');
    expect(
      wrapper.get<HTMLInputElement>(DurationInputText.Seconds).element.value,
    ).toBe('43.33');
  });
});
