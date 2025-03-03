import {
  ApiClient,
  ApiList,
  OperatorDTO,
  SearchOperatorsResponseSchema,
  VerificationStatus,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import { ApiClientKey } from '../../../../../src/api-client';
import SearchOperatorsForm from '../../../../../src/components/operators/selectOperator/search-operators-form.vue';
import SelectOperatorListItem from '../../../../../src/components/operators/selectOperator/select-operator-list-item.vue';
import { GeolocationKey } from '../../../../../src/geolocation';
import TestData from '../../../../fixtures/dive-operators.json';
import { MockGeolocation } from '../../../../mock-geolocation';

const ClearLocationButton = '#btn-clear-operator-location';
const CountsText = '[data-testid="search-operator-counts"]';
const LoadMoreButton = '#searchOperatorsLoadMore';
const NoResultsMessage = '[data-testid="search-operators-no-results"]';
const QueryInput = '#operatorSearchQuery';
const SearchButton = '#searchOperators';
const VerifiedCheckbox = '#operatorSearchVerified';

describe('SearchOperatorsForm component', () => {
  let client: ApiClient;
  let testData: ApiList<OperatorDTO>;
  let geolocation: MockGeolocation;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof SearchOperatorsForm>;

  beforeAll(() => {
    testData = SearchOperatorsResponseSchema.parse(TestData);
    client = new ApiClient();
    geolocation = new MockGeolocation();
  });

  beforeEach(() => {
    pinia = createPinia();
    geolocation.currentLocation = {
      lat: 43.646,
      lon: -79.384,
    };
    opts = {
      global: {
        provide: {
          [ApiClientKey as symbol]: client,
          [GeolocationKey as symbol]: geolocation,
        },
        plugins: [pinia],
      },
    };
  });

  it("will perform a basic search based on user's current location", async () => {
    const spy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValueOnce(testData);
    const wrapper = mount(SearchOperatorsForm, opts);
    await flushPromises();

    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      location: geolocation.currentLocation,
      radius: 50,
    });

    expect(wrapper.get(CountsText).text()).toMatchSnapshot();
    expect(wrapper.get(LoadMoreButton).isVisible()).toBe(true);

    const items = wrapper.findAllComponents(SelectOperatorListItem);
    expect(items).toHaveLength(testData.data.length);
    items.forEach((item, index) => {
      expect(item.props('operator')).toEqual(testData.data[index]);
    });
  });

  it("will perform a basic search if user's location cannot be determined", async () => {
    geolocation.currentLocation = undefined;
    const spy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValueOnce(testData);
    const wrapper = mount(SearchOperatorsForm, opts);
    await flushPromises();

    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({});

    expect(wrapper.get(CountsText).text()).toMatchSnapshot();
    expect(wrapper.get(LoadMoreButton).isVisible()).toBe(true);

    const items = wrapper.findAllComponents(SelectOperatorListItem);
    expect(items).toHaveLength(testData.data.length);
    items.forEach((item, index) => {
      expect(item.props('operator')).toEqual(testData.data[index]);
    });
  });

  it('will perform a more robust search', async () => {
    const query = 'best dive shop';
    const spy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValueOnce(testData);
    const wrapper = mount(SearchOperatorsForm, opts);
    await flushPromises();

    await wrapper.get(QueryInput).setValue(query);
    await wrapper.get(VerifiedCheckbox).setValue(true);
    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      query,
      verification: VerificationStatus.Verified,
      location: geolocation.currentLocation,
      radius: 50,
    });

    expect(wrapper.get(CountsText).text()).toMatchSnapshot();
    expect(wrapper.get(LoadMoreButton).isVisible()).toBe(true);

    const items = wrapper.findAllComponents(SelectOperatorListItem);
    expect(items).toHaveLength(testData.data.length);
    items.forEach((item, index) => {
      expect(item.props('operator')).toEqual(testData.data[index]);
    });
  });

  it('will load more results on request', async () => {
    const spy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValueOnce({
        data: testData.data.slice(0, 10),
        totalCount: testData.totalCount,
      })
      .mockResolvedValueOnce({
        data: testData.data.slice(10, 20),
        totalCount: testData.totalCount,
      });
    const wrapper = mount(SearchOperatorsForm, opts);
    await flushPromises();

    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    await wrapper.get(LoadMoreButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith({
      location: geolocation.currentLocation,
      radius: 50,
    });
    expect(spy).toHaveBeenCalledWith({
      location: geolocation.currentLocation,
      radius: 50,
      skip: 10,
    });

    expect(wrapper.get(CountsText).text()).toMatchSnapshot();

    const items = wrapper.findAllComponents(SelectOperatorListItem);
    expect(items).toHaveLength(20);
    items.forEach((item, index) => {
      expect(item.props('operator')).toEqual(testData.data[index]);
    });
  });

  it('will display a message if there are no results to show', async () => {
    const spy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValueOnce({ data: [], totalCount: 0 });
    const wrapper = mount(SearchOperatorsForm, opts);
    await flushPromises();

    await wrapper.get(SearchButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      location: geolocation.currentLocation,
      radius: 50,
    });

    expect(wrapper.get(CountsText).text()).toMatchSnapshot();
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
    expect(wrapper.get(NoResultsMessage).isVisible()).toBe(true);
  });

  it('will allow the user to clear the location', async () => {
    const spy = jest
      .spyOn(client.operators, 'searchOperators')
      .mockResolvedValueOnce(testData);
    const wrapper = mount(SearchOperatorsForm, opts);
    await flushPromises();

    await wrapper.get(ClearLocationButton).trigger('click');
    await wrapper.get(SearchButton).trigger('click');

    expect(spy).toHaveBeenCalledWith({});
  });
});
