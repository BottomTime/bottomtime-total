import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import FormLocationSelect from '../../../../src/components/common/form-location-select.vue';

const TestId = 'mah-select';
const Latitude = 25.915738052691395;
const Longitude = -80.07950492939037;

const RadiusSlider = `[data-testid="${TestId}-radius"]`;
const ChangeLocationButton = `[data-testid="${TestId}-select-btn"]`;
const ClearLocationButton = `[data-testid="${TestId}-clear-btn"]`;
const CoordinatesText = `[data-testid="${TestId}-coords"]`;

// Location dialog
const LatitudeInput = 'input#latitude';
const LongitudeInput = 'input#longitude';
const ConfirmLocationButton = '[data-testid="confirm-location"]';
const CancelLocationButton = '[data-testid="cancel-location"]';

describe('FormLocationSelect component', () => {
  let opts: ComponentMountingOptions<typeof FormLocationSelect>;

  beforeAll(() => {
    opts = {
      global: {
        stubs: { teleport: true },
      },
    };
  });

  it('will render correctly with no value', () => {
    const wrapper = mount(FormLocationSelect, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly without radius slider', () => {
    const wrapper = mount(FormLocationSelect, {
      props: {
        modelValue: {
          lat: Latitude,
          lon: Longitude,
        },
      },
      ...opts,
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly with radius slider', () => {
    const wrapper = mount(FormLocationSelect, {
      props: {
        modelValue: {
          lat: Latitude,
          lon: Longitude,
          radius: 80,
        },
        showRadius: true,
      },
      ...opts,
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will allow a user to select a new location', async () => {
    const wrapper = mount(FormLocationSelect, {
      props: {
        showRadius: false,
        testId: TestId,
      },
      ...opts,
    });

    await wrapper.get(ChangeLocationButton).trigger('click');
    await wrapper.get(LatitudeInput).setValue(Latitude);
    await wrapper.get(LongitudeInput).setValue(Longitude);
    await wrapper.get(ConfirmLocationButton).trigger('click');
    await flushPromises();

    expect(wrapper.find(ConfirmLocationButton).exists()).toBe(false);
    expect(wrapper.get(CoordinatesText).text()).toBe(
      `${Latitude}, ${Longitude}`,
    );

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [
        {
          lat: Latitude,
          lon: Longitude,
        },
      ],
    ]);
  });

  it('will allow a user to select a new location with a radius', async () => {
    const radius = 120;
    const wrapper = mount(FormLocationSelect, {
      props: {
        showRadius: true,
        testId: TestId,
      },
      ...opts,
    });

    await wrapper.get(ChangeLocationButton).trigger('click');
    await wrapper.get(LatitudeInput).setValue(Latitude);
    await wrapper.get(LongitudeInput).setValue(Longitude);
    await wrapper.get(ConfirmLocationButton).trigger('click');
    await flushPromises();

    await wrapper.get(RadiusSlider).setValue(radius);

    expect(wrapper.find(ConfirmLocationButton).exists()).toBe(false);
    expect(wrapper.get(CoordinatesText).text()).toBe(
      `${Latitude}, ${Longitude}`,
    );

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toHaveLength(2);
    expect(emitted![1]).toEqual([
      {
        lat: Latitude,
        lon: Longitude,
        radius,
      },
    ]);
  });

  it('will allow a user to update a location', async () => {
    const radius = 120;
    const wrapper = mount(FormLocationSelect, {
      props: {
        showRadius: true,
        testId: TestId,
        modelValue: {
          lat: 77.7,
          lon: -7.77,
          radius: 200,
        },
      },
      ...opts,
    });

    await wrapper.get(ChangeLocationButton).trigger('click');
    await wrapper.get(LatitudeInput).setValue(Latitude);
    await wrapper.get(LongitudeInput).setValue(Longitude);
    await wrapper.get(ConfirmLocationButton).trigger('click');
    await flushPromises();

    await wrapper.get(RadiusSlider).setValue(radius);

    expect(wrapper.find(ConfirmLocationButton).exists()).toBe(false);
    expect(wrapper.get(CoordinatesText).text()).toBe(
      `${Latitude}, ${Longitude}`,
    );

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toHaveLength(2);
    expect(emitted![1]).toEqual([
      {
        lat: Latitude,
        lon: Longitude,
        radius,
      },
    ]);
  });

  it('will allow a user to cancel changing a location', async () => {
    const wrapper = mount(FormLocationSelect, {
      props: {
        modelValue: {
          lat: Latitude,
          lon: Longitude,
        },
        testId: TestId,
      },
      ...opts,
    });

    await wrapper.get(ChangeLocationButton).trigger('click');
    await wrapper.get(CancelLocationButton).trigger('click');

    expect(wrapper.find(ConfirmLocationButton).exists()).toBe(false);
    expect(wrapper.get(CoordinatesText).text()).toBe(
      `${Latitude}, ${Longitude}`,
    );
  });

  it('will allow a user to clear a location', async () => {
    const wrapper = mount(FormLocationSelect, {
      props: {
        showRadius: true,
        testId: TestId,
        modelValue: {
          lat: 77.7,
          lon: -7.77,
          radius: 200,
        },
      },
      ...opts,
    });

    await wrapper.get(ClearLocationButton).trigger('click');

    expect(wrapper.find(CoordinatesText).exists()).toBe(false);
    expect(wrapper.find(RadiusSlider).exists()).toBe(false);
    expect(wrapper.emitted('update:modelValue')).toEqual([[undefined]]);
  });
});
