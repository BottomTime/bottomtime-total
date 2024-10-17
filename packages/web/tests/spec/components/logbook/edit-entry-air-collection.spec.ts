import {
  ListTanksResponseDTO,
  ListTanksResponseSchema,
  PressureUnit,
  TankMaterial,
} from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import * as uuid from 'uuid';

import EditEntryAirCollection from '../../../../src/components/logbook/edit-entry-air-collection.vue';
import { EditEntryAirFormData } from '../../../../src/components/logbook/edit-entry-air-form-data';
import EditEntryAir from '../../../../src/components/logbook/edit-entry-air.vue';
import TestTanks from '../../../fixtures/tanks.json';

jest.mock('uuid');

const AddTankButton = '#btn-add-tank';

const TestEntries: EditEntryAirFormData[] = [
  {
    count: 2,
    endPressure: 2000,
    hePercent: 40,
    id: '1930a031-835d-48fa-ab81-795c982eb806',
    o2Percent: 21,
    pressureUnit: PressureUnit.PSI,
    startPressure: 3000,
    tankId: 'd1bb5518-e571-4f4d-8aca-e521fd6dca9f',
    tankInfo: {
      id: 'd1bb5518-e571-4f4d-8aca-e521fd6dca9f',
      name: 'AL80',
      volume: 11.1,
      workingPressure: 3000,
      isSystem: true,
      material: TankMaterial.Aluminum,
    },
  },
  {
    count: 1,
    endPressure: 1000,
    id: 'ac26a86e-b0b1-42d6-b9dc-7f4fc7306f17',
    o2Percent: 50,
    pressureUnit: PressureUnit.PSI,
    startPressure: 3000,
    hePercent: 0,
    tankId: 'd1bb5518-e571-4f4d-8aca-e521fd6dca9f',
    tankInfo: {
      id: 'd1bb5518-e571-4f4d-8aca-e521fd6dca9f',
      name: 'AL80',
      volume: 11.1,
      workingPressure: 3000,
      isSystem: true,
      material: TankMaterial.Aluminum,
    },
  },
];

describe('EditEntryAirCollection component', () => {
  let tankData: ListTanksResponseDTO;
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof EditEntryAirCollection>;

  beforeEach(() => {
    tankData = ListTanksResponseSchema.parse(TestTanks);
    pinia = createPinia();
    opts = {
      props: {
        tanks: tankData.tanks,
        air: [],
      },
      global: {
        plugins: [pinia],
        stubs: {
          teleport: true,
        },
      },
    };
  });

  it('will render correctly with no entries', () => {
    const wrapper = mount(EditEntryAirCollection, opts);
    expect(wrapper.findAllComponents(EditEntryAir)).toHaveLength(0);
    expect(wrapper.find(AddTankButton).isVisible()).toBe(true);
  });

  it('will render correctly with a couple of entries', async () => {
    opts.props = {
      tanks: tankData.tanks,
      air: TestEntries,
    };
    const wrapper = mount(EditEntryAirCollection, opts);
    expect(wrapper.find(AddTankButton).isVisible()).toBe(true);

    const entries = wrapper.findAllComponents(EditEntryAir);
    expect(entries).toHaveLength(2);
    entries.forEach((entry, index) => {
      expect(entry.props('air')).toEqual(TestEntries[index]);
    });
  });

  it('will emit add event when add tank button is clicked', async () => {
    const id = '84dd66c7-3edf-4b52-8a45-a299d7d5c587';
    jest.spyOn(uuid, 'v4').mockReturnValue(id);
    const wrapper = mount(EditEntryAirCollection, opts);
    await wrapper.get(AddTankButton).trigger('click');
    expect(wrapper.emitted('add')).toEqual([
      [
        {
          count: '',
          endPressure: '',
          hePercent: '',
          o2Percent: '',
          pressureUnit: 'bar',
          startPressure: '',
          tankId: '',
          id,
        },
      ],
    ]);
  });

  it('will emit remove event when a user removes an entry', async () => {
    opts.props = {
      tanks: tankData.tanks,
      air: TestEntries,
    };
    const wrapper = mount(EditEntryAirCollection, opts);
    await wrapper
      .findAllComponents(EditEntryAir)[1]
      .vm.$emit('remove', TestEntries[1].id);
    await wrapper.get('[data-testid="dialog-confirm-button"').trigger('click');
    expect(wrapper.emitted('remove')).toEqual([[TestEntries[1].id]]);
    expect(wrapper.find('[data-testid="dialog-confirm-button"').exists()).toBe(
      false,
    );
  });

  it('will allow a user to change their mind about removing an entry', async () => {
    opts.props = {
      tanks: tankData.tanks,
      air: TestEntries,
    };
    const wrapper = mount(EditEntryAirCollection, opts);
    await wrapper
      .findAllComponents(EditEntryAir)[1]
      .vm.$emit('remove', TestEntries[1].id);
    await wrapper.get('[data-testid="dialog-cancel-button"').trigger('click');
    expect(wrapper.find('[data-testid="dialog-confirm-button"').exists()).toBe(
      false,
    );
    expect(wrapper.emitted('remove')).toBeUndefined();
  });
});
