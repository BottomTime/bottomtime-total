import {
  ApiClient,
  ApiList,
  DiveSiteDTO,
  SearchDiveSitesResponseSchema,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import FormLocationPicker from 'src/components/common/form-location-picker.vue';
import { GeolocationKey } from 'src/geolocation';
import { MockGeolocation } from 'tests/mock-geolocation';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../../src/api-client';
import SearchDiveSitesForm from '../../../../../src/components/diveSites/selectSite/search-dive-sites-form.vue';
import SelectDiveSiteListItem from '../../../../../src/components/diveSites/selectSite/select-dive-site-list-item.vue';
import { createRouter } from '../../../../fixtures/create-router';
import TestDiveSiteData from '../../../../fixtures/dive-sites-search-results.json';
import StarRatingStub from '../../../../star-rating-stub.vue';

const SearchButton = '[data-testid="search-sites"]';
const ResultsCounts = '[data-testid="search-sites-counts"]';
const ResultsList = '[data-testid="search-sites-results-list"]';
const QueryInput = '[data-testid="site-search-query"]';
const NoResultsMessage = '[data-testid="search-sites-no-results"]';
const LoadMoreButton = '[data-testid="search-sites-load-more"]';

describe('SearchDiveSitesForm component', () => {
  let client: ApiClient;
  let router: Router;
  let results: ApiList<DiveSiteDTO>;

  let pinia: Pinia;
  let geolocation: MockGeolocation;
  let opts: ComponentMountingOptions<typeof SearchDiveSitesForm>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
    results = SearchDiveSitesResponseSchema.parse(TestDiveSiteData);
    results.data = results.data.slice(0, 10);
  });

  beforeEach(() => {
    pinia = createPinia();
    geolocation = new MockGeolocation();
    opts = {
      props: {
        multiSelect: false,
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [GeolocationKey as symbol]: geolocation,
        },
        stubs: {
          teleport: true,
          StarRating: StarRatingStub,
        },
      },
    };
  });

  it('will not render list if a search has not been done yet', () => {
    const wrapper = mount(SearchDiveSitesForm, opts);
    expect(wrapper.find(ResultsList).exists()).toBe(false);
    expect(wrapper.find(ResultsCounts).exists()).toBe(false);
  });

  it('will allow a blank search', async () => {
    const spy = jest
      .spyOn(client.diveSites, 'searchDiveSites')
      .mockResolvedValue({
        data: [],
        totalCount: 0,
      });

    const wrapper = mount(SearchDiveSitesForm, opts);
    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({ limit: 30 });
  });

  it('will allow a more complex search', async () => {
    const spy = jest
      .spyOn(client.diveSites, 'searchDiveSites')
      .mockResolvedValue({
        data: [],
        totalCount: 0,
      });

    const wrapper = mount(SearchDiveSitesForm, opts);
    await flushPromises();

    await wrapper.get(QueryInput).setValue('Oregon');
    await wrapper
      .getComponent(FormLocationPicker)
      .vm.$emit('update:modelValue', {
        lat: 45,
        lon: -123,
        radius: 280,
      });
    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      limit: 30,
      query: 'Oregon',
      radius: 280,
      location: { lat: 45, lon: -123 },
    });
  });

  it('will show a message if no results are returned', async () => {
    jest.spyOn(client.diveSites, 'searchDiveSites').mockResolvedValue({
      data: [],
      totalCount: 0,
    });

    const wrapper = mount(SearchDiveSitesForm, opts);
    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    expect(wrapper.find(NoResultsMessage).isVisible()).toBe(true);
    expect(wrapper.find(ResultsList).exists()).toBe(false);
    expect(wrapper.find(ResultsCounts).text()).toBe(
      'Showing 0 of 0 dive sites.',
    );
  });

  it('will display results when they are returned', async () => {
    jest.spyOn(client.diveSites, 'searchDiveSites').mockResolvedValue(results);

    const wrapper = mount(SearchDiveSitesForm, opts);
    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    expect(wrapper.find(NoResultsMessage).exists()).toBe(false);
    expect(wrapper.find(ResultsCounts).text()).toBe(
      'Showing 10 of 1200 dive sites.',
    );
    expect(wrapper.find(ResultsList).isVisible()).toBe(true);

    const items = wrapper.findAllComponents(SelectDiveSiteListItem);
    expect(items).toHaveLength(results.data.length);

    items.forEach((item, index) => {
      expect(item.props('site')).toEqual(results.data[index]);
    });
  });

  it('will allow users to load more results', async () => {
    const spy = jest
      .spyOn(client.diveSites, 'searchDiveSites')
      .mockResolvedValueOnce({
        data: results.data.slice(0, 5),
        totalCount: results.totalCount,
      })
      .mockResolvedValueOnce({
        data: results.data.slice(5, 10),
        totalCount: results.totalCount,
      });

    const wrapper = mount(SearchDiveSitesForm, opts);
    await flushPromises();

    await wrapper.get(QueryInput).setValue('Oregon');
    await wrapper
      .getComponent(FormLocationPicker)
      .vm.$emit('update:modelValue', {
        lat: 45,
        lon: -123,
        radius: 280,
      });
    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    await wrapper.get(LoadMoreButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenLastCalledWith({
      limit: 30,
      skip: 5,
      location: { lat: 45, lon: -123 },
      query: 'Oregon',
      radius: 280,
    });

    const items = wrapper.findAllComponents(SelectDiveSiteListItem);
    expect(items).toHaveLength(results.data.length);

    items.forEach((item, index) => {
      expect(item.props('site')).toEqual(results.data[index]);
    });
  });

  it('will not show load more button if all results are loaded', async () => {
    jest.spyOn(client.diveSites, 'searchDiveSites').mockResolvedValue({
      data: results.data,
      totalCount: results.data.length,
    });

    const wrapper = mount(SearchDiveSitesForm, opts);
    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
  });

  it('will re-emit event when dive site is selected', async () => {
    jest.spyOn(client.diveSites, 'searchDiveSites').mockResolvedValue(results);

    const wrapper = mount(SearchDiveSitesForm, opts);
    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    await wrapper
      .get(`[data-testid="select-site-${results.data[6].id}"]`)
      .trigger('click');

    expect(wrapper.emitted('site-selected')).toEqual([[results.data[6]]]);
  });

  it('will highlight the selected site when it is clicked', async () => {
    jest.spyOn(client.diveSites, 'searchDiveSites').mockResolvedValue(results);

    const wrapper = mount(SearchDiveSitesForm, opts);
    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    await wrapper
      .get(`[data-testid="site-name-${results.data[6].id}"]`)
      .trigger('click');

    const item = wrapper.findAllComponents(SelectDiveSiteListItem).at(6)!;
    expect(item).toBeDefined();
    expect(item.props('selected')).toBe(true);
  });
});
