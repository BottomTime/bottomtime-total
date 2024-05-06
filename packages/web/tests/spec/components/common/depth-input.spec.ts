import { DepthUnit } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import DepthInput from '../../../../src/components/common/depth-input.vue';
import { useCurrentUser } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

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
      global: {
        plugins: [pinia, router],
      },
    };
  });

  it('will render with no value', () => {
    const wrapper = mount(DepthInput);
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('');
    expect(wrapper.get('button').text()).toBe('m');
  });

  it('will render with a value', () => {
    const wrapper = mount(DepthInput, {
      props: {
        modelValue: {
          depth: 10,
          unit: DepthUnit.Feet,
        },
      },
    });
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('10');
    expect(wrapper.get('button').text()).toBe('ft');
  });

  it("will default to the current user's preferred depth unit", () => {
    currentUser.user = {
      ...BasicUser,
      settings: {
        ...BasicUser.settings,
        depthUnit: DepthUnit.Feet,
      },
    };
    const wrapper = mount(DepthInput, opts);
    expect(wrapper.get('button').text()).toBe('ft');
  });

  it('will return undefined if the value is left blank', async () => {
    opts.props = {
      modelValue: {
        depth: 10,
        unit: DepthUnit.Feet,
      },
    };
    const wrapper = mount(DepthInput, opts);
    await wrapper.get('input').setValue('');
    expect(wrapper.emitted('update:modelValue')).toEqual([[undefined]]);
  });

  it('will return a depth of -1 if value is invalid', async () => {
    const wrapper = mount(DepthInput, opts);
    await wrapper.find('input').setValue('nope');
    expect(wrapper.emitted('update:modelValue')).toEqual([
      [{ depth: -1, unit: DepthUnit.Meters }],
    ]);
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
    await wrapper.find('input').setValue('32');
    expect(wrapper.emitted('update:modelValue')).toEqual([
      [{ depth: 32, unit: DepthUnit.Feet }],
    ]);
  });

  it('will allow the user to change the depth unit', async () => {
    const wrapper = mount(DepthInput, opts);

    await wrapper.get('input').setValue('32');
    await wrapper.get('button').trigger('click');
    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [{ depth: 32, unit: DepthUnit.Meters }],
      [{ depth: 32, unit: DepthUnit.Feet }],
      [{ depth: 32, unit: DepthUnit.Meters }],
    ]);
  });
});
