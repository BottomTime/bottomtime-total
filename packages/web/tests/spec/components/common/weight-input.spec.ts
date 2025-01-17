import { UserDTO, WeightUnit } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import WeightInput from '../../../../src/components/common/weight-input.vue';
import { useCurrentUser } from '../../../../src/store';
import { BasicUser } from '../../../fixtures/users';

const WeightInputText = 'input#weight';
const UnitButton = 'button#weight-unit';

describe('WeightInput component', () => {
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof WeightInput>;

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      props: {
        controlId: 'weight',
      },
      global: {
        plugins: [pinia],
      },
    };
  });

  it('will render with no value', () => {
    currentUser.user = null;
    const wrapper = mount(WeightInput, opts);
    expect(wrapper.get<HTMLInputElement>(WeightInputText).element.value).toBe(
      '',
    );
    expect(wrapper.get(UnitButton).text()).toBe('kg');
  });

  it('will render with a weight value', () => {
    const user: UserDTO = {
      ...BasicUser,
      settings: {
        ...BasicUser.settings,
        weightUnit: WeightUnit.Pounds,
      },
    };
    currentUser.user = user;
    opts.props = {
      ...opts.props,
      modelValue: 5.5,
      unit: WeightUnit.Pounds,
    };
    const wrapper = mount(WeightInput, opts);
    expect(wrapper.get<HTMLInputElement>(WeightInputText).element.value).toBe(
      '5.5',
    );
    expect(wrapper.get(UnitButton).text()).toBe('lbs');
  });

  it('will render with a string value', () => {
    currentUser.user = null;
    opts.props = { ...opts.props, modelValue: 'yo!' };
    const wrapper = mount(WeightInput, opts);
    expect(wrapper.get<HTMLInputElement>(WeightInputText).element.value).toBe(
      'yo!',
    );
    expect(wrapper.get(UnitButton).text()).toBe('kg');
  });

  it('will fire an event when user toggles the unit', async () => {
    const user: UserDTO = {
      ...BasicUser,
      settings: {
        ...BasicUser.settings,
        weightUnit: WeightUnit.Pounds,
      },
    };
    currentUser.user = user;
    opts.props = {
      ...opts.props,
      modelValue: 5.5,
      unit: WeightUnit.Pounds,
    };

    const wrapper = mount(WeightInput, opts);

    await wrapper.get(UnitButton).trigger('click');
    await wrapper.setProps({ unit: WeightUnit.Kilograms });
    await wrapper.get(UnitButton).trigger('click');

    expect(wrapper.emitted('toggle-unit')).toEqual([
      [WeightUnit.Kilograms],
      [WeightUnit.Pounds],
    ]);
  });
});
