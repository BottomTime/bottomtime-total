import { SearchDiveSitesParamsDTO } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { GeolocationKey } from 'src/geolocation';
import { MockGeolocation } from 'tests/mock-geolocation';

import SearchDiveSitesForm from '../../../../src/components/diveSites/search-dive-sites-form.vue';

const SearchInput = '[data-testid="search-dive-sites"]';
const SelectLocation = '[data-testid="location-picker-set"]';
const LatitudeInput = '[data-testid="location-picker-lat"]';
const LongitudeInput = '[data-testid="location-picker-lon"]';
const SaveLocationButton = '[data-testid="location-picker-save"]';
const CancelLocationButton = '[data-testid="location-picker-cancel"]';
const ClearLocation = '[data-testid="location-picker-clear"]';
const RangeInput = '[data-testid="location-picker-radius"]';
const SearchCoordinates = '[data-testid="location-picker-gps"]';
const RatingInput = '[data-testid="rating"]';
const DifficultyInput = '[data-testid="difficulty"]';
const RefreshButton = '[data-testid="refresh-dive-sites"]';

const Latitude = 20.422207555692225;
const Longitude = -87.015536937484;

describe('Search Dive Sites Form', () => {
  let params: SearchDiveSitesParamsDTO;
  let geolocation: MockGeolocation;
  let opts: ComponentMountingOptions<typeof SearchDiveSitesForm>;

  beforeEach(() => {
    geolocation = new MockGeolocation();
    params = {};
    opts = {
      props: { params },
      global: {
        provide: {
          [GeolocationKey as symbol]: geolocation,
        },
        stubs: { teleport: true },
      },
    };
  });

  it('will allow a user to filter their search results', async () => {
    const wrapper = mount(SearchDiveSitesForm, opts);

    await wrapper.get(SearchInput).setValue('secret cove');

    await wrapper.get(SelectLocation).trigger('click');
    await wrapper.get(LatitudeInput).setValue(Latitude);
    await wrapper.get(LongitudeInput).setValue(Longitude);
    await wrapper.get(SaveLocationButton).trigger('click');
    await flushPromises();
    await wrapper.get(RangeInput).setValue('350');

    await wrapper.get(RatingInput).setValue('4');
    await wrapper.get(DifficultyInput).setValue('3.5');

    await wrapper.get('[data-testid="shore-access-true"]').setValue(true);
    await wrapper.get('[data-testid="free-to-dive-true"]').setValue(true);
    await wrapper.get('[data-testid="water-type-fresh"]').setValue(true);

    await wrapper.get(RefreshButton).trigger('click');

    expect(wrapper.emitted('search')).toMatchSnapshot();
  });

  it('will allow a user to refresh with minimal search criteria', async () => {
    const wrapper = mount(SearchDiveSitesForm, opts);
    await wrapper.get(RefreshButton).trigger('click');
    expect(wrapper.emitted('search')).toMatchSnapshot();
  });

  it('will allow a user to cancel out of the location dialog', async () => {
    const wrapper = mount(SearchDiveSitesForm, opts);

    await wrapper.get(SelectLocation).trigger('click');
    await wrapper.get(CancelLocationButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(SearchCoordinates).text()).toMatchSnapshot();
  });

  it('will allow a user to clear the location', async () => {
    const wrapper = mount(SearchDiveSitesForm, opts);

    await wrapper.get(SelectLocation).trigger('click');
    await wrapper.get(LatitudeInput).setValue(Latitude);
    await wrapper.get(LongitudeInput).setValue(Longitude);
    await wrapper.get(SaveLocationButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(SearchCoordinates).text()).toMatchSnapshot();
    await wrapper.get(ClearLocation).trigger('click');

    expect(wrapper.get(SearchCoordinates).text()).toMatchSnapshot();
    await wrapper.get(RefreshButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('search')).toMatchSnapshot();
  });
});
