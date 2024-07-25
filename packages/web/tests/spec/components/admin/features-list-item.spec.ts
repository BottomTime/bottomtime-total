import { FeatureDTO } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import FeaturesListItem from '../../../../src/components/admin/features-list-item.vue';
import FormToggle from '../../../../src/components/common/form-toggle.vue';

describe('FeaturesListItem component', () => {
  let data: FeatureDTO;
  let opts: ComponentMountingOptions<typeof FeaturesListItem>;

  beforeEach(() => {
    data = {
      createdAt: new Date('2024-07-25T14:06:39Z'),
      updatedAt: new Date('2024-07-25T14:06:39Z'),
      enabled: true,
      key: 'test_key',
      name: 'Really Cool Feature',
      description: 'This is a really cool feature.',
    };
    opts = {
      props: {
        feature: data,
      },
    };
  });

  it('will render the component', () => {
    const wrapper = mount(FeaturesListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit select event when name of feature is clicked', async () => {
    const wrapper = mount(FeaturesListItem, opts);
    await wrapper.get(`[data-testid="select-${data.key}"]`).trigger('click');
    expect(wrapper.emitted('select')).toEqual([[data]]);
  });

  it('will emit edit event when edit button is clicked', async () => {
    const wrapper = mount(FeaturesListItem, opts);
    await wrapper.get(`[data-testid="edit-${data.key}"]`).trigger('click');
    expect(wrapper.emitted('edit')).toEqual([[data]]);
  });

  it('will emit delete event when delete button is clicked', async () => {
    const wrapper = mount(FeaturesListItem, opts);
    await wrapper.get(`[data-testid="delete-${data.key}"]`).trigger('click');
    expect(wrapper.emitted('delete')).toEqual([[data.key]]);
  });

  it('will emit toggle event when toggle button is clicked', async () => {
    const wrapper = mount(FeaturesListItem, opts);
    const toggle = wrapper.getComponent(FormToggle);
    toggle.vm.$emit('update:modelValue', false);
    expect(wrapper.emitted('toggle')).toEqual([[data]]);
  });

  it('will show a spinner when toggling', async () => {
    const wrapper = mount(FeaturesListItem, opts);
    await wrapper.setProps({ isToggling: true });
    expect(
      wrapper.find(`[data-testid="toggling-${data.key}"]`).isVisible(),
    ).toBe(true);
  });
});
