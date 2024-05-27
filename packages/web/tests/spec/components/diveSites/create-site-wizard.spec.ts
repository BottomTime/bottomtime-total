import { DepthUnit } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import FormButton from '../../../../src/components/common/form-button.vue';
import CreateSiteWizard from '../../../../src/components/diveSites/create-site-wizard.vue';

const SaveButton = '[data-testid="save-new-site"]';
const ErrorsSummary = '[data-testid="form-errors"]';
const LocationInput = '[data-testid="new-site-location"]';
const LatitudeInput = '[data-testid="new-site-lat"]';
const LongitudeInput = '[data-testid="new-site-lon"]';
const DirectionsInput = '[data-testid="new-site-directions"]';
const NameInput = '[data-testid="new-site-name"]';
const DepthInput = '[data-testid="new-site-depth"]';
const DescriptionInput = '[data-testid="new-site-description"]';

const FreeToDive = {
  uknown: '[data-testid="free-to-dive-undefined"]',
  yes: '[data-testid="free-to-dive-true"]',
  no: '[data-testid="free-to-dive-false"]',
} as const;

const ShoreAccess = {
  uknown: '[data-testid="shore-access-undefined"]',
  yes: '[data-testid="shore-access-true"]',
  no: '[data-testid="shore-access-false"]',
} as const;

describe('CreateSiteWizard component', () => {
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof CreateSiteWizard>;

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia],
      },
    };
  });

  it('will validate for missing fields', async () => {
    const wrapper = mount(CreateSiteWizard, opts);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(ErrorsSummary).text()).toMatchSnapshot();
    expect(wrapper.get('[data-testid="newSiteLocation-error"]').text()).toBe(
      'Location is required',
    );
    expect(wrapper.get('[data-testid="newSiteName-error"]').text()).toBe(
      'Name is required',
    );
    expect(wrapper.get('[data-testid="latitude-error"]').text()).toBe(
      'Latitude is required',
    );
    expect(wrapper.get('[data-testid="longitude-error"]').text()).toBe(
      'Longitude is required',
    );

    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will validate for invalid inputs', async () => {
    const wrapper = mount(CreateSiteWizard, opts);
    await wrapper.get(DepthInput).setValue('-4');
    await wrapper.get(LatitudeInput).setValue('9000');
    await wrapper.get(LongitudeInput).setValue('-2000');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(ErrorsSummary).text()).toMatchSnapshot();
    expect(wrapper.get('[data-testid="latitude-error"]').text()).toBe(
      'Latitude must be between -90.0 and 90.0',
    );
    expect(wrapper.get('[data-testid="longitude-error"]').text()).toBe(
      'Longitude must be between -180.0 and 180.0',
    );
    expect(wrapper.get('[data-testid="newSiteDepth-error"]').text()).toBe(
      'Depth must be a positive number and no more than 300m (984ft)',
    );

    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will emit a save event for a minimal site', async () => {
    const name = 'My Secret Site';
    const location = 'Need to Know Basis Only';
    const lat = 45.1234;
    const lon = -123.4567;

    const wrapper = mount(CreateSiteWizard, opts);
    await wrapper.get(NameInput).setValue(name);
    await wrapper.get(LocationInput).setValue(location);
    await wrapper.get(LatitudeInput).setValue(lat);
    await wrapper.get(LongitudeInput).setValue(lon);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          gps: { lat, lon },
          name,
          location,
        },
      ],
    ]);
  });

  it('will emit a save event for a fully filled out site', async () => {
    const name = 'My Secret Site';
    const location = 'Need to Know Basis Only';
    const lat = 45.1234;
    const lon = -123.4567;
    const directions = 'First star to the right and straight on till morning';
    const depth = 34.2;
    const description = 'Most epic site';

    const wrapper = mount(CreateSiteWizard, opts);
    await wrapper.get(NameInput).setValue(name);
    await wrapper.get(LocationInput).setValue(location);
    await wrapper.get(LatitudeInput).setValue(lat);
    await wrapper.get(LongitudeInput).setValue(lon);
    await wrapper.get(DescriptionInput).setValue(description);
    await wrapper.get(DirectionsInput).setValue(directions);
    await wrapper.get(DepthInput).setValue(depth);
    await wrapper.get(FreeToDive.yes).setValue(true);
    await wrapper.get(ShoreAccess.yes).setValue(true);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          depth: { depth, unit: DepthUnit.Meters },
          description,
          directions,
          freeToDive: true,
          gps: { lat, lon },
          name,
          location,
          shoreAccess: true,
        },
      ],
    ]);
  });

  it('will show spinner if isSaving is true', () => {
    opts.props = { isSaving: true };
    const wrapper = mount(CreateSiteWizard, opts);
    expect(
      wrapper.getComponent<typeof FormButton>(SaveButton).props('isLoading'),
    ).toBe(true);
    expect(wrapper.get('fieldset').element.disabled).toBe(true);
  });
});
