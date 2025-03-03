import { DepthUnit } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import DepthInput from '../../../../src/components/common/depth-input.vue';
import { useCurrentUser } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

const BaseProps: InstanceType<typeof DepthInput>['$props'] = {
  modelValue: '',
  controlId: 'depth',
};
const DepthInputText = 'input#depth';
const UnitButton = 'button#depth-unit';
const BottomlessCheckbox = 'input#depth-bottomless';

describe('DepthInput component', () => {
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof DepthInput>;

  beforeAll(() => {
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = null;
    opts = {
      props: BaseProps,
      global: {
        plugins: [pinia, router],
      },
    };
  });

  it('will render with no value', () => {
    const wrapper = mount(DepthInput, opts);
    expect(wrapper.get<HTMLInputElement>(DepthInputText).element.value).toBe(
      '',
    );
    expect(wrapper.get(UnitButton).text()).toBe('m');
  });

  it('will render with a depth value', () => {
    opts.props = {
      ...BaseProps,
      modelValue: 10,
      unit: DepthUnit.Feet,
    };
    const wrapper = mount(DepthInput, opts);
    expect(wrapper.get<HTMLInputElement>(DepthInputText).element.value).toBe(
      '10',
    );
    expect(wrapper.get(UnitButton).text()).toBe('ft');
  });

  it('will render with a string value', () => {
    opts.props = { ...BaseProps, modelValue: 'yo!' };
    const wrapper = mount(DepthInput, opts);
    expect(wrapper.get<HTMLInputElement>(DepthInputText).element.value).toBe(
      'yo!',
    );
    expect(wrapper.get(UnitButton).text()).toBe('m');
  });

  it('will render in bottomless state if allowBottomless is true and depth is zero', () => {
    opts.props = {
      ...BaseProps,
      modelValue: 0,
      unit: DepthUnit.Meters,
      allowBottomless: true,
    };
    const wrapper = mount(DepthInput, opts);

    const textInput = wrapper.get<HTMLInputElement>(DepthInputText);
    expect(textInput.element.value).toBe('0');
    expect(textInput.element.disabled).toBe(true);

    const unitButton = wrapper.get<HTMLButtonElement>(UnitButton);
    expect(unitButton.text()).toBe('m');
    expect(unitButton.element.disabled).toBe(true);

    expect(
      wrapper.get<HTMLInputElement>(BottomlessCheckbox).element.checked,
    ).toBe(true);
  });

  it('will return an empty string if the field is left blank', async () => {
    opts.props = {
      ...BaseProps,
      modelValue: 10,
      unit: DepthUnit.Feet,
    };
    const wrapper = mount(DepthInput, opts);
    await wrapper.get(DepthInputText).setValue('');
    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
  });

  it('will return a string if the value entered cannot be parsed as a number', async () => {
    const wrapper = mount(DepthInput, opts);
    await wrapper.find(DepthInputText).setValue('nope');
    expect(wrapper.emitted('update:modelValue')).toEqual([['nope']]);
  });

  it('will return the correct depth', async () => {
    currentUser.user = {
      ...BasicUser,
      settings: {
        ...BasicUser.settings,
        depthUnit: DepthUnit.Feet,
      },
    };
    const wrapper = mount(DepthInput, opts);
    await wrapper.find(DepthInputText).setValue('32');
    expect(wrapper.emitted('update:modelValue')).toEqual([[32]]);
  });

  it('will allow the user to change the depth unit', async () => {
    const wrapper = mount(DepthInput, opts);

    await wrapper.get(DepthInputText).setValue('32');
    await wrapper.get(UnitButton).trigger('click');
    await wrapper.setProps({ unit: DepthUnit.Feet });
    await wrapper.get(UnitButton).trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[32]]);
    expect(wrapper.emitted('toggle-unit')).toEqual([
      [DepthUnit.Feet],
      [DepthUnit.Meters],
    ]);
  });

  it('will update the value if the modelValue prop changes', async () => {
    opts.props = {
      ...BaseProps,
      modelValue: 22,
      unit: DepthUnit.Meters,
    };
    const wrapper = mount(DepthInput, opts);

    expect(wrapper.get<HTMLInputElement>(DepthInputText).element.value).toBe(
      '22',
    );
    expect(wrapper.get(UnitButton).text()).toBe('m');

    await wrapper.setProps({
      modelValue: 10,
      unit: DepthUnit.Feet,
    });

    expect(wrapper.get<HTMLInputElement>(DepthInputText).element.value).toBe(
      '10',
    );
    expect(wrapper.get(UnitButton).text()).toBe('ft');
  });

  it('will hide bottomless checkbox if bottomless is not allowed', () => {
    const wrapper = mount(DepthInput, opts);
    expect(wrapper.find(BottomlessCheckbox).exists()).toBe(false);
  });

  it('will show bottomless checkbox if bottomless is allowed', () => {
    opts.props = {
      ...BaseProps,
      allowBottomless: true,
    };
    const wrapper = mount(DepthInput, opts);
    expect(wrapper.find(BottomlessCheckbox).exists()).toBe(true);
  });

  it('will set depth to zero and disable when bottomless is checked', async () => {
    opts.props = {
      ...BaseProps,
      allowBottomless: true,
    };
    const wrapper = mount(DepthInput, opts);
    await wrapper.get(BottomlessCheckbox).setValue(true);
    expect(wrapper.emitted('update:modelValue')).toEqual([[0]]);
    expect(wrapper.get<HTMLInputElement>(DepthInputText).element.disabled).toBe(
      true,
    );
    expect(wrapper.get<HTMLButtonElement>(UnitButton).element.disabled).toBe(
      true,
    );
  });

  it('will re-enable the depth input when bottomless is unchecked', async () => {
    opts.props = {
      ...BaseProps,
      allowBottomless: true,
      modelValue: 0,
      unit: DepthUnit.Meters,
    };
    const wrapper = mount(DepthInput, opts);
    await wrapper.get(BottomlessCheckbox).setValue(false);
    const text = wrapper.get<HTMLInputElement>(DepthInputText);
    expect(text.element.value).toBe('');
    expect(text.element.disabled).toBe(false);
  });

  it('will disable all controls when disabled is true', () => {
    opts.props = {
      ...BaseProps,
      allowBottomless: true,
      disabled: true,
    };
    const wrapper = mount(DepthInput, opts);
    expect(wrapper.get<HTMLInputElement>(DepthInputText).element.disabled).toBe(
      true,
    );
    expect(wrapper.get<HTMLButtonElement>(UnitButton).element.disabled).toBe(
      true,
    );
    expect(
      wrapper.get<HTMLInputElement>(BottomlessCheckbox).element.disabled,
    ).toBe(true);
  });
});
