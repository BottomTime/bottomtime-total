import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import AddressDialog from '../../../../src/components/dialog/address-dialog.vue';

const Address = '123 Street St., Placeville, ON';
const Latitude = 19.023151462400467;
const Longitude = -69.30816614510981;

const AddressInput = 'input#address-dlg-address';
const LatitudeInput = 'input#address-dlg-lat';
const LongitudeInput = 'input#address-dlg-lon';

const AddressError = '[data-testid="address-dlg-address-error"]';
const LatitudeError = '[data-testid="address-dlg-lat-error"]';
const LongitudeError = '[data-testid="address-dlg-lon-error"]';

const ConfirmButton = '[data-testid="address-dlg-confirm"]';
const CancelButton = '[data-testid="address-dlg-cancel"]';

describe('AddressDialog component', () => {
  let opts: ComponentMountingOptions<typeof AddressDialog>;

  beforeEach(() => {
    opts = {
      props: {
        visible: true,
        title: 'Find an address',
      },
      global: {
        stubs: { teleport: true },
      },
    };
  });

  it('will allow a user to find and select an address', async () => {
    const wrapper = mount(AddressDialog, opts);

    await wrapper.get(AddressInput).setValue(Address);
    await wrapper.get(LatitudeInput).setValue(Latitude);
    await wrapper.get(LongitudeInput).setValue(Longitude);
    await wrapper.get(ConfirmButton).trigger('click');

    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        Address,
        {
          lat: Latitude,
          lon: Longitude,
        },
      ],
    ]);
  });

  it('will validate against missing fields', async () => {
    const wrapper = mount(AddressDialog, opts);

    await wrapper.get(ConfirmButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(AddressError).text()).toBe('Address is required');
    expect(wrapper.get(LatitudeError).text()).toBe('Latitude is required');
    expect(wrapper.get(LongitudeError).text()).toBe('Longitude is required');

    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will validate against invalid values', async () => {
    const wrapper = mount(AddressDialog, opts);

    await wrapper.get(LatitudeInput).setValue('nope');
    await wrapper.get(LongitudeInput).setValue('10000');

    await wrapper.get(ConfirmButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(LatitudeError).text()).toBe(
      'Latitude must be a number between -90 and 90',
    );
    expect(wrapper.get(LongitudeError).text()).toBe(
      'Longitude must be a number between -180 and 180',
    );

    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will allow a user to cancel out of the dialog', async () => {
    const wrapper = mount(AddressDialog, opts);
    await wrapper.get(CancelButton).trigger('click');
    expect(wrapper.emitted('cancel')).toBeDefined();
  });
});
