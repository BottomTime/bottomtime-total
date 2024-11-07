import { ApiList, ListTanksResponseSchema, TankDTO } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import TanksListItem from '../../../../src/components/tanks/tanks-list-item.vue';
import TanksList from '../../../../src/components/tanks/tanks-list.vue';
import TestData from '../../../fixtures/tanks.json';

const CountsText = '[data-testid="tanks-list-counts"]';
const EmptyListMessage = '[data-testid="tanks-list-empty"]';
const AddButton = 'button#tanks-list-add';

describe('TanksList component', () => {
  let tanks: ApiList<TankDTO>;

  let opts: ComponentMountingOptions<typeof TanksList>;

  beforeAll(() => {
    tanks = ListTanksResponseSchema.parse(TestData);
  });

  beforeEach(() => {
    opts = {
      props: {
        tanks,
      },
    };
  });

  it('will render an empty list', () => {
    opts.props = { tanks: { data: [], totalCount: 0 } };
    const wrapper = mount(TanksList, opts);
    expect(wrapper.get(CountsText).text()).toBe('Showing 0 tank profile(s)');
    expect(wrapper.get(EmptyListMessage).isVisible()).toBe(true);
    expect(wrapper.findAllComponents(TanksListItem)).toHaveLength(0);
  });

  it('will render a list', () => {
    const wrapper = mount(TanksList, opts);
    expect(wrapper.get(CountsText).text()).toBe(
      `Showing ${tanks.data.length} tank profile(s)`,
    );
    expect(wrapper.find(EmptyListMessage).exists()).toBe(false);

    const items = wrapper.findAllComponents(TanksListItem);
    expect(items).toHaveLength(tanks.data.length);
    items.forEach((item, i) => {
      expect(item.props('tank')).toEqual(tanks.data[i]);
    });
  });

  it('will emit add event if add button is clicked', async () => {
    const wrapper = mount(TanksList, opts);
    await wrapper.find(AddButton).trigger('click');
    expect(wrapper.emitted('add')).toHaveLength(1);
  });

  it('will bubble up a delete event from a list item', async () => {
    const wrapper = mount(TanksList, opts);
    wrapper
      .findAllComponents(TanksListItem)
      .at(3)!
      .vm.$emit('delete', tanks.data[3]);
    expect(wrapper.emitted('delete')).toEqual([[tanks.data[3]]]);
  });

  it('will bubble up a select event from a list item', async () => {
    const wrapper = mount(TanksList, opts);
    wrapper
      .findAllComponents(TanksListItem)
      .at(5)!
      .vm.$emit('select', tanks.data[5]);
    expect(wrapper.emitted('select')).toEqual([[tanks.data[5]]]);
  });
});
