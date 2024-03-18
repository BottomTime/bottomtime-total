import LocationDialog from '@/components/dialog/location-dialog.vue';
import { flushPromises, mount } from '@vue/test-utils';

const LatitudeInput = '[data-testid="latitude"]';
const LongitudeInput = '[data-testid="longitude"]';
const SelectButton = '[data-testid="confirm-location"]';
const CancelButton = '[data-testid="cancel-location"]';
const ErrorsList = '[data-testid="location-errors"]';

const Latitude = 20.422207555692225;
const Longitude = -87.015536937484;

describe('Location Dialog', () => {
  it('will not render if visible is set to false', () => {
    const wrapper = mount(LocationDialog, { props: { visible: false } });
    expect(wrapper.find('[data-testid="dialog-modal"]').exists()).toBe(false);
  });

  it('will allow the user to select a location', async () => {
    const wrapper = mount(LocationDialog, { props: { visible: true } });

    await wrapper.get(LatitudeInput).setValue(Latitude);
    await wrapper.get(LongitudeInput).setValue(Longitude);
    await wrapper.get(SelectButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('confirm')).toEqual([
      [{ lat: Latitude, lon: Longitude }],
    ]);
  });

  it('will allow the user to cancel out of the dialog', async () => {
    const wrapper = mount(LocationDialog, { props: { visible: true } });

    await wrapper.get(LatitudeInput).setValue(Latitude);
    await wrapper.get(LongitudeInput).setValue(Longitude);
    await wrapper.get(CancelButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('confirm')).toBeUndefined();
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('will render with pre-populated location', () => {
    const wrapper = mount(LocationDialog, {
      props: { visible: true, location: { lat: Latitude, lon: Longitude } },
    });

    expect(wrapper.get<HTMLInputElement>(LatitudeInput).element.value).toBe(
      Latitude.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(LongitudeInput).element.value).toBe(
      Longitude.toString(),
    );
  });

  it('will validate for missing fields', async () => {
    const wrapper = mount(LocationDialog, { props: { visible: true } });

    await wrapper.get(SelectButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('confirm')).toBeUndefined();
    expect(wrapper.emitted('cancel')).toBeUndefined();

    expect(wrapper.find(ErrorsList).text()).toMatchSnapshot();
  });

  ['north', '-91', '91'].forEach((latitude) => {
    it(`will validate for invalid latitude: ${latitude}`, async () => {
      const wrapper = mount(LocationDialog, { props: { visible: true } });

      await wrapper.get(LatitudeInput).setValue(latitude);
      await wrapper.get(LongitudeInput).setValue(Longitude);
      await wrapper.get(SelectButton).trigger('click');
      await flushPromises();

      expect(wrapper.emitted('confirm')).toBeUndefined();
      expect(wrapper.emitted('cancel')).toBeUndefined();

      expect(wrapper.find(ErrorsList).text()).toMatchSnapshot();
    });
  });

  ['west', '-181', '181'].forEach((longitude) => {
    it(`will validate for invalid longitude: ${longitude}`, async () => {
      const wrapper = mount(LocationDialog, { props: { visible: true } });

      await wrapper.get(LatitudeInput).setValue(Latitude);
      await wrapper.get(LongitudeInput).setValue(longitude);
      await wrapper.get(SelectButton).trigger('click');
      await flushPromises();

      expect(wrapper.emitted('confirm')).toBeUndefined();
      expect(wrapper.emitted('cancel')).toBeUndefined();

      expect(wrapper.find(ErrorsList).text()).toMatchSnapshot();
    });
  });

  it('will allow for the dialog to be reset programmatically', async () => {
    const wrapper = mount(LocationDialog, { props: { visible: true } });

    await wrapper.get(LatitudeInput).setValue(Latitude);
    await wrapper.get(LongitudeInput).setValue('invalid');
    await wrapper.get(SelectButton).trigger('click');
    await flushPromises();

    wrapper.vm.reset();
    await flushPromises();

    expect(wrapper.get<HTMLInputElement>(LatitudeInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(LongitudeInput).element.value).toBe(
      '',
    );
    expect(wrapper.find(ErrorsList).exists()).toBe(false);
  });
});
