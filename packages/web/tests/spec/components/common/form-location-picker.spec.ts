import { GpsCoordinates } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import FormLocationPicker from 'src/components/common/form-location-picker.vue';
import GoogleMap from 'src/components/common/google-map.vue';

const GpsText = '[data-testid="location-picker-gps"]';
const SetButton = '[data-testid="location-picker-set"]';
const ClearButton = '[data-testid="location-picker-clear"]';
const LatitudeInput = '[data-testid="location-picker-lat"]';
const LongitudeInput = '[data-testid="location-picker-lon"]';
const SaveButton = '[data-testid="location-picker-save"]';
const CancelButton = '[data-testid="location-picker-cancel"]';
const RadiusSlider = '[data-testid="location-picker-radius"]';

const TestLocation: GpsCoordinates = {
  lat: 44.19983,
  lon: -76.53093,
};

describe('FormLocationPicker component', () => {
  let opts: ComponentMountingOptions<typeof FormLocationPicker>;

  beforeEach(() => {
    opts = {
      props: {
        showRadius: false,
      },
    };
  });

  it('will render without a location', () => {
    const wrapper = mount(FormLocationPicker, opts);
    expect(wrapper.find(RadiusSlider).exists()).toBe(false);
    expect(wrapper.find(ClearButton).exists()).toBe(false);
    expect(wrapper.get(GpsText).text()).toMatchSnapshot();
  });

  it('will allow a location to be set by clicking the map', async () => {
    const wrapper = mount(FormLocationPicker, opts);
    wrapper.getComponent(GoogleMap).vm.$emit('click', TestLocation);
    await flushPromises();

    expect(wrapper.get(GpsText).text()).toMatchSnapshot();
    expect(wrapper.emitted('update:modelValue')).toEqual([[TestLocation]]);
  });

  it('will allow a location to be set manually', async () => {
    const wrapper = mount(FormLocationPicker, opts);

    await wrapper.get(SetButton).trigger('click');
    await wrapper.get(LatitudeInput).setValue(TestLocation.lat);
    await wrapper.get(LongitudeInput).setValue(TestLocation.lon);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(GpsText).text()).toMatchSnapshot();
    expect(wrapper.emitted('update:modelValue')).toEqual([[TestLocation]]);
  });

  it('will validate latitude and longitude', async () => {
    const wrapper = mount(FormLocationPicker, opts);

    await wrapper.get(SetButton).trigger('click');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();
    expect(wrapper.get('ul').text()).toMatchSnapshot();

    await wrapper.get(LatitudeInput).setValue(91);
    await wrapper.get(LongitudeInput).setValue('nope');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();
    expect(wrapper.get('ul').text()).toMatchSnapshot();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('will allow a user to cancel manual edit', async () => {
    const wrapper = mount(FormLocationPicker, opts);

    await wrapper.get(SetButton).trigger('click');
    await wrapper.get(LatitudeInput).setValue(TestLocation.lat);
    await wrapper.get(LongitudeInput).setValue(TestLocation.lon);
    await wrapper.get(CancelButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(GpsText).text()).toMatchSnapshot();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('will allow location to be set with radius', async () => {
    const wrapper = mount(FormLocationPicker, opts);
    await wrapper.setProps({ showRadius: true });

    wrapper.getComponent(GoogleMap).vm.$emit('click', TestLocation);
    await flushPromises();

    await wrapper.get(RadiusSlider).setValue(180);

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [
        {
          ...TestLocation,
          radius: 180,
        },
      ],
    ]);
  });
});
