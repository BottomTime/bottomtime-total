import {
  ListTanksResponseDTO,
  ListTanksResponseSchema,
  PressureUnit,
} from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { EditEntryAirFormData } from '../../../../src/components/logbook/edit-entry-air-form-data';
import EditEntryAir from '../../../../src/components/logbook/edit-entry-air.vue';
import TankData from '../../../fixtures/tanks.json';

const TestId = '42eee38a-5579-4e9d-b738-7126b7682b97';
const RemoveButton = '[data-testid="remove-tank"]';
const TankSelect = `#tanks-select-${TestId}`;
const Doubles = `#doubles-${TestId}`;
const TankSummary = '[data-testid="tank-summary"]';
const StartPressure = `#start-pressure-${TestId}`;
const EndPressure = `#end-pressure-${TestId}`;
const OxygenPercentage = `#o2-${TestId}`;
const HeliumPercentage = `#he-${TestId}`;

describe('EditEntryAir component', () => {
  let opts: ComponentMountingOptions<typeof EditEntryAir>;
  let tankData: ListTanksResponseDTO;
  let air: EditEntryAirFormData;

  beforeAll(() => {
    tankData = ListTanksResponseSchema.parse(TankData);
  });

  beforeEach(() => {
    air = {
      count: 1,
      endPressure: 800,
      hePercent: 12,
      id: TestId,
      o2Percent: 32,
      pressureUnit: PressureUnit.PSI,
      startPressure: 3000,
      tankId: tankData.tanks[0].id,
      tankInfo: {
        ...tankData.tanks[0],
      },
    };

    opts = {
      props: {
        tanks: tankData.tanks,
        ordinal: 2,
        air,
      },
    };
  });

  it('will render correctly', () => {
    const wrapper = mount(EditEntryAir, opts);
    expect(wrapper.get<HTMLSelectElement>(TankSelect).element.value).toBe(
      air.tankId,
    );
    expect(wrapper.get<HTMLInputElement>(Doubles).element.checked).toBe(false);
    expect(wrapper.get(TankSummary).html()).toMatchSnapshot();
    expect(wrapper.get<HTMLInputElement>(StartPressure).element.value).toBe(
      air.startPressure.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(EndPressure).element.value).toBe(
      air.endPressure.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(OxygenPercentage).element.value).toBe(
      air.o2Percent.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(HeliumPercentage).element.value).toBe(
      air.hePercent.toString(),
    );
  });

  it('will render a blank air entry correctly', () => {
    const blank: EditEntryAirFormData = {
      count: '',
      endPressure: '',
      hePercent: '',
      id: TestId,
      o2Percent: '',
      pressureUnit: PressureUnit.Bar,
      startPressure: '',
      tankId: '',
    };
    opts.props = {
      tanks: tankData.tanks,
      ordinal: 2,
      air: blank,
    };
    const wrapper = mount(EditEntryAir, opts);

    expect(wrapper.get<HTMLSelectElement>(TankSelect).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(Doubles).element.checked).toBe(false);
    expect(wrapper.find(TankSummary).exists()).toBe(false);
    expect(wrapper.get<HTMLInputElement>(StartPressure).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(EndPressure).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(OxygenPercentage).element.value).toBe(
      '',
    );
    expect(wrapper.get<HTMLInputElement>(HeliumPercentage).element.value).toBe(
      '',
    );
  });

  it('will render correctly if saved tank info does not match an item in the list', () => {
    opts.props = {
      tanks: tankData.tanks,
      ordinal: 2,
      air: {
        ...air,
        tankId: '',
      },
    };
    const wrapper = mount(EditEntryAir, opts);
    expect(wrapper.get<HTMLSelectElement>(TankSelect).element.value).toBe(
      'current',
    );
    expect(wrapper.get<HTMLInputElement>(Doubles).element.checked).toBe(false);
    expect(wrapper.get(TankSummary).html()).toMatchSnapshot();
    expect(wrapper.get<HTMLInputElement>(StartPressure).element.value).toBe(
      air.startPressure.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(EndPressure).element.value).toBe(
      air.endPressure.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(OxygenPercentage).element.value).toBe(
      air.o2Percent.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(HeliumPercentage).element.value).toBe(
      air.hePercent.toString(),
    );
  });

  it('will render with "Doubles" checked if count is 2', () => {
    opts.props = {
      tanks: tankData.tanks,
      ordinal: 2,
      air: {
        ...air,
        count: 2,
      },
    };
    const wrapper = mount(EditEntryAir, opts);
    expect(wrapper.get<HTMLInputElement>(Doubles).element.checked).toBe(true);
  });

  it('will emit remove event if remove button is clicked', async () => {
    const wrapper = mount(EditEntryAir, opts);
    await wrapper.get(RemoveButton).trigger('click');
    expect(wrapper.emitted('remove')).toEqual([[air.id]]);
  });
});
