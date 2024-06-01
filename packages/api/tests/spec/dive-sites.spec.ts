import axios, { AxiosInstance } from 'axios';

import { DiveSite } from '../../src/client';
import { DiveSitesApiClient } from '../../src/client/dive-sites';
import {
  CreateOrUpdateDiveSiteSchema,
  DiveSitesSortBy,
  SearchDiveSitesResponseDTO,
  SearchDiveSitesResponseSchema,
  SortOrder,
  WaterType,
} from '../../src/types';
import SearchResults from '../fixtures/dive-sites-search-results.json';
import { DiveSiteWithFullProperties } from '../fixtures/sites';

describe('Dive Site API client', () => {
  let axiosClient: AxiosInstance;
  let apiClient: DiveSitesApiClient;
  let searchResults: SearchDiveSitesResponseDTO;

  beforeAll(() => {
    axiosClient = axios.create();
    apiClient = new DiveSitesApiClient(axiosClient);

    searchResults = SearchDiveSitesResponseSchema.parse(SearchResults);
  });

  it('will retrieve a single dive site', async () => {
    const spy = jest.spyOn(axiosClient, 'get').mockResolvedValue({
      data: DiveSiteWithFullProperties,
    });

    const result = await apiClient.getDiveSite(DiveSiteWithFullProperties.id);

    expect(spy).toHaveBeenCalledWith(
      `/api/diveSites/${DiveSiteWithFullProperties.id}`,
    );
    expect(result.toJSON()).toEqual(DiveSiteWithFullProperties);
  });

  it('will create a new dive site', async () => {
    const options = CreateOrUpdateDiveSiteSchema.parse(
      DiveSiteWithFullProperties,
    );
    const spy = jest
      .spyOn(axiosClient, 'post')
      .mockResolvedValue({ data: DiveSiteWithFullProperties });

    const result = await apiClient.createDiveSite(options);
    expect(result.toJSON()).toEqual(DiveSiteWithFullProperties);
    expect(spy).toHaveBeenCalledWith('/api/diveSites', options);
  });

  it('will perform a search for dive sites', async () => {
    const spy = jest.spyOn(axiosClient, 'get').mockResolvedValue({
      data: searchResults,
    });

    const result = await apiClient.searchDiveSites({
      query: 'Puget Sound',
      freeToDive: true,
      shoreAccess: true,
      waterType: WaterType.Salt,
      difficulty: { min: 1, max: 3 },
      location: {
        lat: 47.6,
        lon: -122.3,
      },
      radius: 250,
      rating: { min: 3.5, max: 5 },
      skip: 100,
      limit: 200,
      sortBy: DiveSitesSortBy.Rating,
      sortOrder: SortOrder.Descending,
      creator: 'bob',
    });

    expect(spy.mock.lastCall).toMatchSnapshot();
    expect(result.totalCount).toBe(searchResults.totalCount);
    expect(result.sites).toHaveLength(searchResults.sites.length);
    expect(result.sites.map((site: DiveSite) => site.toJSON())).toEqual(
      searchResults.sites,
    );
  });

  it('will perform a search with minimal options', async () => {
    const spy = jest.spyOn(axiosClient, 'get').mockResolvedValue({
      data: searchResults,
    });

    const result = await apiClient.searchDiveSites();

    expect(spy.mock.lastCall).toMatchSnapshot();
    expect(result.totalCount).toBe(searchResults.totalCount);
    expect(result.sites).toHaveLength(searchResults.sites.length);
    expect(result.sites.map((site: DiveSite) => site.toJSON())).toEqual(
      searchResults.sites,
    );
  });

  it('will wrap a DTO in a DiveSite object', () => {
    const obj = apiClient.wrapDTO(DiveSiteWithFullProperties);
    expect(obj).toBeInstanceOf(DiveSite);
    expect(obj.id).toBe(DiveSiteWithFullProperties.id);
  });
});
