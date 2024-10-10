import { SearchDiveSitesParamsDTO } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import SearchDiveSitesForm from '../../../../src/components/diveSites/search-dive-sites-form.vue';

const SearchInput = '[data-testid="search-dive-sites"]';
const SelectLocation = '[data-testid="select-location"]';
const ClearLocation = '[data-testid="clear-location"]';
const RangeInput = '[data-testid="search-range"]';
const SearchCoordinates = '[data-testid="search-coordinates"]';
const RatingInput = '[data-testid="rating"]';
const DifficultyInput = '[data-testid="difficulty"]';
const RefreshButton = '[data-testid="refresh-dive-sites"]';

const Latitude = 20.422207555692225;
const Longitude = -87.015536937484;

describe('Search Dive Sites Form', () => {
  let params: SearchDiveSitesParamsDTO;
  let opts: ComponentMountingOptions<typeof SearchDiveSitesForm>;

  beforeEach(() => {
    params = {};
    opts = {
      props: { params },
      global: {
        stubs: { teleport: true },
      },
    };
  });

  it('will allow a user to filter their search results', async () => {
    const wrapper = mount(SearchDiveSitesForm, opts);

    await wrapper.get(SearchInput).setValue('secret cove');

    await wrapper.get(SelectLocation).trigger('click');
    await wrapper.get('[data-testid="latitude"]').setValue(Latitude);
    await wrapper.get('[data-testid="longitude"]').setValue(Longitude);
    await wrapper.get('[data-testid="confirm-location"]').trigger('click');
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
    await wrapper.get('[data-testid="cancel-location"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="dialog-modal"]').exists()).toBe(false);
    expect(wrapper.find(SearchCoordinates).exists()).toBe(false);
  });

  it('will allow a user to clear the location', async () => {
    const wrapper = mount(SearchDiveSitesForm, opts);

    await wrapper.get(SelectLocation).trigger('click');
    await wrapper.get('[data-testid="latitude"]').setValue(Latitude);
    await wrapper.get('[data-testid="longitude"]').setValue(Longitude);
    await wrapper.get('[data-testid="confirm-location"]').trigger('click');
    await flushPromises();

    expect(wrapper.get(SearchCoordinates).text()).toMatchSnapshot();
    await wrapper.get(ClearLocation).trigger('click');

    expect(wrapper.find(SearchCoordinates).exists()).toBe(false);
    await wrapper.get(RefreshButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('search')).toMatchSnapshot();
  });
});
