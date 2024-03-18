import { mount } from '@vue/test-utils';

import FormRadio from '../../../../src/components/common/form-radio.vue';

const InputSelector = 'input[type="radio"]';
const ContentText = 'Click me!';
const Content = `<span>${ContentText}</span>`;

describe('Radio button component', () => {
  it('will render component in unchecked state', () => {
    const wrapper = mount(FormRadio, {
      props: {
        controlId: 'test',
        group: 'test',
        value: 'abcd',
        modelValue: '1234',
      },
      slots: {
        default: Content,
      },
    });

    const radio = wrapper.get<HTMLInputElement>(InputSelector);
    expect(radio.element.checked).toBe(false);
    expect(wrapper.text()).toBe(ContentText);
  });

  it('will render component in checked state', () => {
    const wrapper = mount(FormRadio, {
      props: {
        controlId: 'test',
        group: 'test',
        value: 'abcd',
        modelValue: 'abcd',
      },
      slots: {
        default: Content,
      },
    });

    const radio = wrapper.get<HTMLInputElement>(InputSelector);
    expect(radio.element.checked).toBe(true);
    expect(wrapper.text()).toBe(ContentText);
  });

  it('will render in a disabled state', () => {
    const wrapper = mount(FormRadio, {
      props: {
        controlId: 'test',
        group: 'test',
        value: 'abcd',
        modelValue: '1234',
        disabled: true,
      },
      slots: {
        default: Content,
      },
    });

    const radio = wrapper.get<HTMLInputElement>(InputSelector);
    expect(radio.element.disabled).toBe(true);
  });

  it('will emit change event when checked', async () => {
    const wrapper = mount(FormRadio, {
      props: {
        controlId: 'test',
        group: 'test',
        value: 'abcd',
        modelValue: '1234',
      },
      slots: {
        default: Content,
      },
    });

    const radio = wrapper.get<HTMLInputElement>(InputSelector);
    await radio.setValue(true);

    expect(wrapper.emitted('update:modelValue')).toEqual([['abcd']]);
  });
});
