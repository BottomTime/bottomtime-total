import { TankDTO, TankMaterial } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import EditTank from '../../../../src/components/tanks/edit-tank.vue';

const TestData: TankDTO = {
  id: '6e79e44e-8620-414a-8885-80a26750642a',
  name: 'Test Tank',
  material: TankMaterial.Steel,
  volume: 12.4,
  workingPressure: 200,
  isSystem: true,
};
const BlankTank: TankDTO = {
  id: '',
  name: '',
  material: TankMaterial.Aluminum,
  volume: 0,
  workingPressure: 0,
  isSystem: false,
};

const NameInput = '#name';
const MaterialSelect = {
  aluminum: '#material-al',
  steel: '#material-fe',
} as const;
const VolumeInput = '#volume';
const PressureInput = '#pressure';

const NameError = '[data-testid="name-error"]';
const VolumeError = '[data-testid="volume-error"]';
const PressureError = '[data-testid="pressure-error"]';
const ErrorsList = '[data-testid="edit-tank-form-errors"]';

const SaveButton = '#save-tank';
const DeleteButton = '#delete-tank';

describe('EditTank component', () => {
  let opts: ComponentMountingOptions<typeof EditTank>;

  beforeEach(() => {
    opts = {
      props: {
        tank: { ...BlankTank },
      },
    };
  });

  it('will render an empty form', () => {
    const wrapper = mount(EditTank, opts);

    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(VolumeInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(PressureInput).element.value).toBe('');
    expect(
      wrapper.get<HTMLInputElement>(MaterialSelect.aluminum).element.checked,
    ).toBe(true);

    expect(wrapper.get<HTMLButtonElement>(SaveButton).element.disabled).toBe(
      false,
    );
    expect(wrapper.find(DeleteButton).exists()).toBe(false);
  });

  it('will render with existing values', () => {
    opts.props = { tank: { ...TestData } };
    const wrapper = mount(EditTank, opts);

    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe(
      TestData.name,
    );
    expect(wrapper.get<HTMLInputElement>(VolumeInput).element.value).toBe(
      TestData.volume.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(PressureInput).element.value).toBe(
      TestData.workingPressure.toString(),
    );
    expect(
      wrapper.get<HTMLInputElement>(MaterialSelect.steel).element.checked,
    ).toBe(true);

    expect(wrapper.get<HTMLButtonElement>(SaveButton).element.disabled).toBe(
      false,
    );
    expect(wrapper.find(DeleteButton).exists()).toBe(false);

    expect(
      wrapper.get('[data-testid="edit-tank-capacity"]').text(),
    ).toMatchSnapshot();
  });

  it('will show delete button if show-delete property is set', () => {
    opts.props = { tank: TestData, showDelete: true };
    const wrapper = mount(EditTank, opts);
    expect(wrapper.get(DeleteButton).isVisible()).toBe(true);
  });

  it('will disable the form if is-saving property is set', () => {
    opts.props = { tank: TestData, isSaving: true };
    const wrapper = mount(EditTank, opts);
    expect(wrapper.find('fieldset').element.disabled).toBe(true);
  });

  it('will validate missing fields', async () => {
    const wrapper = mount(EditTank, opts);

    await wrapper.get<HTMLButtonElement>(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toBeUndefined();
    expect(wrapper.get(NameError).text()).toBe(
      'Name of tank profile is required',
    );
    expect(wrapper.get(VolumeError).text()).toBe('Volume is required');
    expect(wrapper.get(PressureError).text()).toBe('Max pressure is required');
    expect(wrapper.get(ErrorsList).text()).toMatchSnapshot();
  });

  it('will validate invalid fields', async () => {
    const wrapper = mount(EditTank, opts);

    await wrapper.get<HTMLInputElement>(VolumeInput).setValue('lots');
    await wrapper.get<HTMLInputElement>(PressureInput).setValue('-3');
    await wrapper.get<HTMLButtonElement>(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toBeUndefined();
    expect(wrapper.get(VolumeError).text()).toBe(
      'Volume must be between 1 and 30 litres',
    );
    expect(wrapper.get(PressureError).text()).toBe(
      'Max pressure must be between 100 and 300 bar',
    );
    expect(wrapper.get(ErrorsList).text()).toMatchSnapshot();
  });

  it('will emit save when the form is updated correctly', async () => {
    const newName = 'Newly-Updated Tank Profile';
    const newVolume = 15.3;
    const newPressure = 250;

    opts.props = { tank: { ...TestData } };
    const wrapper = mount(EditTank, opts);
    await wrapper.get(NameInput).setValue(newName);
    await wrapper.get(MaterialSelect.aluminum).setValue(true);
    await wrapper.get(VolumeInput).setValue(newVolume.toString());
    await wrapper.get(PressureInput).setValue(newPressure.toString());

    await wrapper.get<HTMLButtonElement>(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.find(ErrorsList).exists()).toBe(false);
    expect(wrapper.emitted('save')).toEqual([
      [
        {
          ...TestData,
          name: newName,
          material: TankMaterial.Aluminum,
          volume: newVolume,
          workingPressure: newPressure,
        },
      ],
    ]);
    expect(
      wrapper.get('[data-testid="edit-tank-capacity"]').text(),
    ).toMatchSnapshot();
  });
});
