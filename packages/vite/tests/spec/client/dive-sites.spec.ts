import {
  SearchDiveSitesResponseDTO,
  SearchDiveSitesResponseSchema,
} from '@bottomtime/api';

import axios, { AxiosInstance } from 'axios';

import { DiveSite } from '../../../src/client';
import { DiveSitesApiClient } from '../../../src/client/dive-sites';
import SearchResults from '../../fixtures/dive-sites-search-results.json';
import { DiveSiteWithFullProperties } from '../../fixtures/sites';

describe('Dive Site API client', () => {
  let axiosClient: AxiosInstance;
  let apiClient: DiveSitesApiClient;
  let searchResults: SearchDiveSitesResponseDTO;

  beforeAll(() => {
    axiosClient = axios.create();
    apiClient = new DiveSitesApiClient(axiosClient);

    searchResults = SearchDiveSitesResponseSchema.parse(SearchResults);
  });

  it('will perform a search for dive sites', () => {});

  it('will perform a search with minimal options', async () => {
    const spy = jest.spyOn(axiosClient, 'get').mockResolvedValue({
      data: searchResults,
    });

    const result = await apiClient.searchDiveSites();

    expect(spy).toHaveBeenCalledWith('/api/diveSites', {
      params: {
        difficulty: undefined,
        location: undefined,
        rating: undefined,
      },
    });
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
