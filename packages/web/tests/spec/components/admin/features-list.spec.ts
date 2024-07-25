import { FeatureDTO } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import FeaturesListItem from '../../../../src/components/admin/features-list-item.vue';
import FeaturesList from '../../../../src/components/admin/features-list.vue';

const TestData: FeatureDTO[] = [
  {
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'awesome_feature',
    name: 'Latest Awesome Thing',
    description: 'This is a test feature',
    enabled: true,
  },
  {
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'secret_feature',
    name: 'Top Secret Feature',
    description: 'Shhh! No one is supposed to know about this',
    enabled: false,
  },
  {
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'old_feature',
    name: 'Old and Busted',
    description: 'This is a test feature',
    enabled: false,
  },
];

describe('FeaturesList component', () => {
  let opts: ComponentMountingOptions<typeof FeaturesList>;

  beforeEach(() => {
    opts = {
      props: {
        features: TestData,
      },
    };
  });

  it('will render a list of features', () => {
    const wrapper = mount(FeaturesList, opts);
    expect(wrapper.get('[data-testid="features-count"]').text()).toBe(
      'Showing 3 feature flags',
    );
    const items = wrapper.findAllComponents(FeaturesListItem);
    expect(items).toHaveLength(3);
    items.forEach((item, index) => {
      expect(item.text()).toContain(TestData[index].name);
    });
  });

  it('will render a message if there are no features to display', async () => {
    const wrapper = mount(FeaturesList, opts);
    await wrapper.setProps({ features: [] });
    expect(wrapper.get('[data-testid="features-count"]').text()).toBe(
      'Showing 0 feature flags',
    );
    const items = wrapper.findAllComponents(FeaturesListItem);
    expect(items).toHaveLength(0);
    expect(
      wrapper.find('[data-testid="no-features-message"]').isVisible(),
    ).toBe(true);
  });

  it('will emit a create event when the create button is clicked', async () => {
    const wrapper = mount(FeaturesList, opts);
    await wrapper.get('[data-testid="create-feature"]').trigger('click');
    expect(wrapper.emitted('create')).toHaveLength(1);
  });

  it('will re-emit a delete event when a delete button is clicked', async () => {
    const wrapper = mount(FeaturesList, opts);
    const item = wrapper.getComponent(FeaturesListItem);
    item.vm.$emit('delete', TestData[0].key);
    expect(wrapper.emitted('delete')).toEqual([[TestData[0].key]]);
  });

  it('will re-emit an edit event when the name of a feature flag is clicked', async () => {
    const wrapper = mount(FeaturesList, opts);
    const item = wrapper.getComponent(FeaturesListItem);
    item.vm.$emit('select', TestData[0]);
    expect(wrapper.emitted('edit')).toEqual([[TestData[0]]]);
  });

  it('will re-emit an edit event when an edit button is clicked', async () => {
    const wrapper = mount(FeaturesList, opts);
    const item = wrapper.getComponent(FeaturesListItem);
    item.vm.$emit('edit', TestData[0]);
    expect(wrapper.emitted('edit')).toEqual([[TestData[0]]]);
  });

  it('will re-emit a toggle event when a toggle button is clicked', async () => {
    const wrapper = mount(FeaturesList, opts);
    const item = wrapper.getComponent(FeaturesListItem);
    item.vm.$emit('toggle', TestData[0]);
    expect(wrapper.emitted('toggle')).toEqual([[TestData[0]]]);
  });
});
