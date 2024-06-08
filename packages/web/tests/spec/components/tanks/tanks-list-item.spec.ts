import { TankDTO, TankMaterial } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import TanksListItem from '../../../../src/components/tanks/tanks-list-item.vue';

const TestData: TankDTO = {
  id: '6e79e44e-8620-414a-8885-80a26750642a',
  name: 'Test Tank',
  material: TankMaterial.Steel,
  volume: 12.4,
  workingPressure: 200,
  isSystem: true,
};

describe('TanksListItem component', () => {
  let opts: ComponentMountingOptions<typeof TanksListItem>;

  beforeEach(() => {
    opts = {
      props: {
        tank: { ...TestData },
      },
    };
  });

  it('will render correctly', () => {
    const wrapper = mount(TanksListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit select event when name is clicked', async () => {
    const wrapper = mount(TanksListItem, opts);
    await wrapper
      .find(`[data-testid="select-tank-${TestData.id}"]`)
      .trigger('click');
    expect(wrapper.emitted('select')).toEqual([[TestData]]);
  });

  it('will emit delete event when delete button is clicked', async () => {
    const wrapper = mount(TanksListItem, opts);
    await wrapper
      .find(`[data-testid="delete-tank-${TestData.id}"]`)
      .trigger('click');
    expect(wrapper.emitted('delete')).toEqual([[TestData]]);
  });
});
