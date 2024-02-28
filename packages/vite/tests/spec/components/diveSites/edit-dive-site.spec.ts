import { DepthUnit, DiveSiteDTO } from '@bottomtime/api';

import { ApiClient, ApiClientKey, DiveSite } from '@/client';
import GoogleMap from '@/components/common/google-map.vue';
import EditDiveSite from '@/components/diveSites/edit-dive-site.vue';
import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { createRouter } from '../../../fixtures/create-router';
import {
  BlankDiveSite,
  DiveSiteWithFullProperties,
  DiveSiteWithMinimalProperties,
} from '../../../fixtures/sites';

const NameInput = '[data-testid="name"]';
const DescriptionInput = '[data-testid="description"]';
const DepthInput = '[data-testid="depth"]';
const DepthUnitInput = '[data-testid="depth-unit"]';
// const DepthBottomlessInput = '[data-testid="depth-bottomless"]';
const LocationInput = '[data-testid="location"]';
const DirectionsInput = '[data-testid="directions"]';

const SaveButton = '[data-testid="save-site"]';
const ResetButton = '[data-testid="reset-site"]';

enum GpsInput {
  Lat = '[data-testid="gps-lat"]',
  Lon = '[data-testid="gps-lon"]',
}

enum FreeToDiveInput {
  Yes = '[data-testid="free-to-dive-true"]',
  No = '[data-testid="free-to-dive-false"]',
  Unknown = '[data-testid="free-to-dive-null"]',
}

enum ShoreAccessInput {
  Yes = '[data-testid="shore-access-true"]',
  No = '[data-testid="shore-access-false"]',
  Unknown = '[data-testid="shore-access-null"]',
}

describe('Edit Dive Site component', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof EditDiveSite>;

  beforeAll(() => {
    router = createRouter();
    client = new ApiClient();
  });

  beforeEach(() => {
    pinia = createPinia();

    opts = {
      props: {
        site: DiveSiteWithMinimalProperties,
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will mount with existing dive site with all properties set', () => {
    opts.props!.site = DiveSiteWithFullProperties;
    const wrapper = mount(EditDiveSite, opts);

    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe(
      DiveSiteWithFullProperties.name,
    );
    expect(wrapper.get<HTMLInputElement>(DescriptionInput).element.value).toBe(
      DiveSiteWithFullProperties.description,
    );
    expect(wrapper.get<HTMLInputElement>(DepthInput).element.value).toBe(
      DiveSiteWithFullProperties.depth!.depth.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(DepthUnitInput).element.value).toBe(
      DiveSiteWithFullProperties.depth!.unit,
    );
    expect(
      wrapper.get<HTMLInputElement>(FreeToDiveInput.Yes).element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>(ShoreAccessInput.Yes).element.checked,
    ).toBe(true);
    expect(wrapper.get<HTMLInputElement>(LocationInput).element.value).toBe(
      DiveSiteWithFullProperties.location,
    );
    expect(wrapper.get<HTMLInputElement>(GpsInput.Lat).element.value).toBe(
      DiveSiteWithFullProperties.gps!.lat!.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(GpsInput.Lon).element.value).toBe(
      DiveSiteWithFullProperties.gps!.lon!.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(DirectionsInput).element.value).toBe(
      DiveSiteWithFullProperties.directions,
    );
  });

  it('will mount with existing dive site with minimal properties set', () => {
    const wrapper = mount(EditDiveSite, opts);

    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe(
      DiveSiteWithMinimalProperties.name,
    );
    expect(wrapper.get<HTMLInputElement>(DescriptionInput).element.value).toBe(
      '',
    );
    expect(wrapper.get<HTMLInputElement>(DepthInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(DepthUnitInput).element.value).toBe(
      DepthUnit.Meters,
    );
    expect(
      wrapper.get<HTMLInputElement>(FreeToDiveInput.Unknown).element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>(ShoreAccessInput.Unknown).element.checked,
    ).toBe(true);
    expect(wrapper.get<HTMLInputElement>(LocationInput).element.value).toBe(
      DiveSiteWithMinimalProperties.location,
    );
    expect(wrapper.get<HTMLInputElement>(GpsInput.Lat).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(GpsInput.Lon).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(DirectionsInput).element.value).toBe(
      '',
    );
  });

  it('will allow a user to edit a dive site', async () => {
    opts.props!.site = BlankDiveSite;
    const wrapper = mount(EditDiveSite, opts);

    const expected: DiveSiteDTO = {
      ...BlankDiveSite,
      name: 'new site name',
      description: 'new site description',
      depth: {
        depth: 12.34,
        unit: DepthUnit.Feet,
      },
      freeToDive: false,
      shoreAccess: false,
      location: 'new site location',
      gps: {
        lat: 12.345,
        lon: -123.456,
      },
      directions: 'new site directions',
    };

    const site = new DiveSite(client.axios, { ...BlankDiveSite });
    const wrapSpy = jest
      .spyOn(client.diveSites, 'wrapDTO')
      .mockReturnValue(site);
    const saveSpy = jest.spyOn(site, 'save').mockResolvedValue();

    await wrapper.get(NameInput).setValue(expected.name);
    await wrapper.get(DescriptionInput).setValue(expected.description);
    await wrapper.get(DepthInput).setValue(expected.depth!.depth);
    await wrapper.get(DepthUnitInput).setValue(expected.depth!.unit);
    await wrapper.get(FreeToDiveInput.No).setValue(true);
    await wrapper.get(ShoreAccessInput.No).setValue(true);
    await wrapper.get(LocationInput).setValue(expected.location);
    await wrapper.get(GpsInput.Lat).setValue(expected.gps!.lat);
    await wrapper.get(GpsInput.Lon).setValue(expected.gps!.lon);
    await wrapper.get(DirectionsInput).setValue(expected.directions);

    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapSpy).toHaveBeenCalledWith(BlankDiveSite);
    expect(saveSpy).toHaveBeenCalled();
    expect(site.toJSON()).toEqual(expected);

    expect(wrapper.emitted('site-updated')).toEqual([[expected]]);
  });

  it('will allow a user to reset changes made to a dive site', async () => {
    opts.props!.site = DiveSiteWithFullProperties;
    const wrapper = mount(EditDiveSite, opts);

    const expected: DiveSiteDTO = {
      ...DiveSiteWithFullProperties,
      name: 'new site name',
      description: 'new site description',
      depth: {
        depth: 12.34,
        unit: DepthUnit.Feet,
      },
      freeToDive: false,
      shoreAccess: false,
      location: 'new site location',
      gps: {
        lat: 12.345,
        lon: -123.456,
      },
      directions: 'new site directions',
    };

    await wrapper.get(NameInput).setValue(expected.name);
    await wrapper.get(DescriptionInput).setValue(expected.description);
    await wrapper.get(DepthInput).setValue(expected.depth!.depth);
    await wrapper.get(DepthUnitInput).setValue(expected.depth!.unit);
    await wrapper.get(FreeToDiveInput.No).setValue(true);
    await wrapper.get(ShoreAccessInput.No).setValue(true);
    await wrapper.get(LocationInput).setValue(expected.location);
    await wrapper.get(GpsInput.Lat).setValue(expected.gps!.lat);
    await wrapper.get(GpsInput.Lon).setValue(expected.gps!.lon);
    await wrapper.get(DirectionsInput).setValue(expected.directions);

    await wrapper.get(ResetButton).trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe(
      DiveSiteWithFullProperties.name,
    );
    expect(wrapper.get<HTMLInputElement>(DescriptionInput).element.value).toBe(
      DiveSiteWithFullProperties.description,
    );
    expect(wrapper.get<HTMLInputElement>(DepthInput).element.value).toBe(
      DiveSiteWithFullProperties.depth!.depth.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(DepthUnitInput).element.value).toBe(
      DiveSiteWithFullProperties.depth!.unit,
    );
    expect(
      wrapper.get<HTMLInputElement>(FreeToDiveInput.Yes).element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>(ShoreAccessInput.Yes).element.checked,
    ).toBe(true);
    expect(wrapper.get<HTMLInputElement>(LocationInput).element.value).toBe(
      DiveSiteWithFullProperties.location,
    );
    expect(wrapper.get<HTMLInputElement>(GpsInput.Lat).element.value).toBe(
      DiveSiteWithFullProperties.gps!.lat!.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(GpsInput.Lon).element.value).toBe(
      DiveSiteWithFullProperties.gps!.lon!.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(DirectionsInput).element.value).toBe(
      DiveSiteWithFullProperties.directions,
    );
  });

  it('will allow a user to change their mind about resetting changes made to a dive site', async () => {
    opts.props!.site = DiveSiteWithFullProperties;
    const wrapper = mount(EditDiveSite, opts);

    const expected: DiveSiteDTO = {
      ...DiveSiteWithFullProperties,
      name: 'new site name',
      description: 'new site description',
      depth: {
        depth: 12.34,
        unit: DepthUnit.Feet,
      },
      freeToDive: false,
      shoreAccess: false,
      location: 'new site location',
      gps: {
        lat: 12.345,
        lon: -123.456,
      },
      directions: 'new site directions',
    };

    await wrapper.get(NameInput).setValue(expected.name);
    await wrapper.get(DescriptionInput).setValue(expected.description);
    await wrapper.get(DepthInput).setValue(expected.depth!.depth);
    await wrapper.get(DepthUnitInput).setValue(expected.depth!.unit);
    await wrapper.get(FreeToDiveInput.No).setValue(true);
    await wrapper.get(ShoreAccessInput.No).setValue(true);
    await wrapper.get(LocationInput).setValue(expected.location);
    await wrapper.get(GpsInput.Lat).setValue(expected.gps!.lat);
    await wrapper.get(GpsInput.Lon).setValue(expected.gps!.lon);
    await wrapper.get(DirectionsInput).setValue(expected.directions);

    await wrapper.get(ResetButton).trigger('click');
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="dialog-modal"]').exists()).toBe(false);
    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe(
      expected.name,
    );
  });

  it('will update the GPS coordinates when the map is clicked', async () => {
    const wrapper = mount(EditDiveSite, opts);
    const map = wrapper.findComponent(GoogleMap);
    map.vm.$emit('click', { lat: 19.345, lon: -23.456 });
    await flushPromises();

    expect(wrapper.get<HTMLInputElement>(GpsInput.Lat).element.value).toBe(
      '19.345',
    );
    expect(wrapper.get<HTMLInputElement>(GpsInput.Lon).element.value).toBe(
      '-23.456',
    );
  });
});
